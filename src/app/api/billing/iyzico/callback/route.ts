import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIyzicoClient, isIyzicoConfigured } from "@/lib/iyzico";
import { logger } from "@/lib/logger";

/**
 * iyzico checkout sonucu callback'i. Kullanıcı ödeme sonrası buraya döner (POST).
 * Query: paymentId (bizim cuid)
 * Body (form): token, locale, status (success|failure)
 *
 * Guvenlik: token'ı iyzico'ya geri gönderip result'u doğrularız. Böylece
 * kullanıcı manuel URL değiştiremez.
 */
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

  const client = getIyzicoClient();
  if (!client) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=client", request.url));
  }

  const result = await new Promise<{
    status: string;
    paymentStatus?: string;
    paymentId?: string;
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
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          providerRefId: result.paymentId ?? null,
          paidAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan },
      }),
    ]);
    logger.info("iyzico payment successful", {
      paymentId: payment.id,
      userId: payment.userId,
      plan: payment.plan,
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
