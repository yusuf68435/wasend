import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIyzicoClient, isIyzicoConfigured } from "@/lib/iyzico";
import { logger } from "@/lib/logger";
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits";

/**
 * iyzico checkout sonucu callback'i. Kullanıcı ödeme sonrası buraya döner (POST).
 * Query: paymentId (bizim cuid)
 * Body (form): token, locale, status (success|failure)
 *
 * Güvenlik katmanları:
 *  1. paymentId cuid — pratikte tahmin edilemez
 *  2. providerToken DB'den — sadece iyzico'nun init'te verdiği token kullanılır
 *  3. checkoutForm.retrieve() server-to-server çağrı → iyzico kendi imzasıyla
 *     "SUCCESS" mu döner? Sadece o zaman plan upgrade
 *  4. Idempotency: payment.status zaten 'paid'/'failed' ise re-process yok
 *     → replay koruma (eski başarılı ödemeyi tekrar göndererek user'ı daha
 *       düşük plan'a "geri" düşürme saldırısı engellenir)
 *  5. Age guard: createdAt > 24 saat ise callback reddedilir (stale replay)
 *  6. Downgrade guard: user'ın mevcut planı payment.plan'dan yüksekse,
 *     replay ile plan'ı düşürmeyi reddet — kullanıcı ara dönem upgrade yapmışsa
 *     eski bir success callback tekrar geldiğinde downgrade olmasın.
 */

const CALLBACK_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 saat

const PLAN_TIER: Record<Plan, number> = {
  STARTER: 0,
  PRO: 1,
  BUSINESS: 2,
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=missing-id", request.url));
  }

  if (!isIyzicoConfigured()) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=not-configured", request.url));
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || !payment.providerToken) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=not-found", request.url));
  }

  // [IDEMPOTENCY] — callback zaten işlenmişse tekrar işleme
  if (payment.status !== "pending") {
    logger.info("iyzico callback replay ignored", {
      paymentId: payment.id,
      existingStatus: payment.status,
    });
    if (payment.status === "paid") {
      return NextResponse.redirect(
        new URL("/dashboard/billing?status=success", request.url),
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard/billing?status=failed", request.url),
    );
  }

  // [AGE GUARD] — 24 saatten eski callback reddedilir
  const age = Date.now() - payment.createdAt.getTime();
  if (age > CALLBACK_MAX_AGE_MS) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        errorMessage: "Callback zaman aşımına uğradı (>24 saat)",
      },
    });
    logger.warn("iyzico callback expired", {
      paymentId: payment.id,
      ageMs: age,
    });
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=expired", request.url),
    );
  }

  const client = getIyzicoClient();
  if (!client) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=client", request.url));
  }

  const result = await new Promise<{
    status: string;
    paymentStatus?: string;
    paymentId?: string;
    paidPrice?: string | number;
    errorMessage?: string;
  }>((resolve) => {
    (
      client as unknown as {
        checkoutForm: {
          retrieve: (
            r: { locale: string; token: string },
            cb: (
              err: Error | null,
              result: {
                status: string;
                paymentStatus?: string;
                paymentId?: string;
                paidPrice?: string | number;
                errorMessage?: string;
              },
            ) => void,
          ) => void;
        };
      }
    ).checkoutForm.retrieve(
      { locale: "tr", token: payment.providerToken! },
      (err, r) => {
        if (err) resolve({ status: "failure", errorMessage: err.message });
        else resolve(r);
      },
    );
  });

  if (result.status === "success" && result.paymentStatus === "SUCCESS") {
    // [AMOUNT VERIFICATION] — iyzico'nun döndüğü paidPrice beklenen plan
    // fiyatına eşit mi? Attacker farklı paymentId → farklı plan trick'ini
    // engeller.
    const expectedAmount = PLAN_LIMITS[payment.plan as Plan]?.priceTry;
    const paidAmount = Number(result.paidPrice);
    if (
      expectedAmount !== undefined &&
      Number.isFinite(paidAmount) &&
      Math.abs(paidAmount - expectedAmount) > 0.01
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          errorMessage: `Tutar uyuşmazlığı: beklenen ${expectedAmount}, ödenen ${paidAmount}`,
        },
      });
      logger.error("iyzico amount mismatch", {
        paymentId: payment.id,
        expected: expectedAmount,
        paid: paidAmount,
      });
      return NextResponse.redirect(
        new URL("/dashboard/billing?error=amount-mismatch", request.url),
      );
    }

    // [DOWNGRADE GUARD] — kullanıcı ara dönemde daha yüksek plan'a geçmişse
    // eski success callback ile downgrade olmasın. Plan tier karşılaştırılır.
    const currentUser = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { plan: true },
    });
    const currentTier = currentUser ? PLAN_TIER[currentUser.plan as Plan] ?? 0 : 0;
    const targetTier = PLAN_TIER[payment.plan as Plan] ?? 0;
    const shouldUpdatePlan = targetTier >= currentTier;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          providerRefId: result.paymentId ?? null,
          paidAt: new Date(),
        },
      });
      if (shouldUpdatePlan) {
        await tx.user.update({
          where: { id: payment.userId },
          data: { plan: payment.plan },
        });
      }
    });
    if (!shouldUpdatePlan) {
      logger.warn("iyzico downgrade guard triggered", {
        paymentId: payment.id,
        currentPlan: currentUser?.plan,
        paymentPlan: payment.plan,
      });
    }

    logger.info("iyzico payment successful", {
      paymentId: payment.id,
      userId: payment.userId,
      plan: payment.plan,
      planApplied: shouldUpdatePlan,
    });
    return NextResponse.redirect(new URL("/dashboard/billing?status=success", request.url));
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "failed",
      errorMessage: result.errorMessage || "iyzico doğrulama başarısız",
    },
  });
  logger.warn("iyzico payment failed", {
    paymentId: payment.id,
    error: result.errorMessage,
  });
  return NextResponse.redirect(new URL("/dashboard/billing?status=failed", request.url));
}
