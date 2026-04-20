import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";
import { getIyzicoClient, isIyzicoConfigured } from "@/lib/iyzico";
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits";

const schema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
});

/**
 * iyzico Checkout Form başlat.
 * Başarılı response: { paymentPageUrl }
 * Frontend kullanıcıyı oraya redirect etmeli.
 */
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  if (!isIyzicoConfigured()) {
    return NextResponse.json(
      { error: "Ödeme sistemi henüz aktif değil. Destek ile iletişime geçin." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  const planKey = parsed.data.plan as Plan;
  const limits = PLAN_LIMITS[planKey];
  if (!limits) {
    return NextResponse.json({ error: "Plan bilinmiyor" }, { status: 400 });
  }
  const amountTry = limits.priceTry;

  const payment = await prisma.payment.create({
    data: {
      userId,
      plan: planKey,
      amount: amountTry * 100,
      currency: "TRY",
      status: "pending",
      provider: "iyzico",
    },
  });

  const client = getIyzicoClient();
  if (!client) {
    return NextResponse.json({ error: "iyzico client init edilemedi" }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://wasend.tech";
  const callbackUrl = `${baseUrl}/api/billing/iyzico/callback?paymentId=${payment.id}`;

  const req = {
    locale: "tr",
    conversationId: payment.id,
    price: amountTry.toFixed(2),
    paidPrice: amountTry.toFixed(2),
    currency: "TRY",
    basketId: payment.id,
    paymentGroup: "SUBSCRIPTION",
    callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: user.id,
      name: user.name || "Kullanıcı",
      surname: user.businessName || "WaSend",
      email: user.email,
      identityNumber: "11111111111",
      registrationAddress: user.businessName || "WaSend müşterisi",
      ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
      city: "Istanbul",
      country: "Turkey",
      gsmNumber: user.phone || "+905555555555",
    },
    shippingAddress: {
      contactName: user.name || "Kullanıcı",
      city: "Istanbul",
      country: "Turkey",
      address: user.businessName || "WaSend müşterisi",
    },
    billingAddress: {
      contactName: user.name || "Kullanıcı",
      city: "Istanbul",
      country: "Turkey",
      address: user.businessName || "WaSend müşterisi",
    },
    basketItems: [
      {
        id: planKey,
        name: `WaSend ${planKey} Planı`,
        category1: "Subscription",
        itemType: "VIRTUAL",
        price: amountTry.toFixed(2),
      },
    ],
  };

  interface InitResult {
    status: string;
    errorMessage?: string;
    token?: string;
    paymentPageUrl?: string;
  }
  const result = await new Promise<InitResult>((resolve) => {
    (
      client as unknown as {
        checkoutFormInitialize: {
          create: (r: unknown, cb: (err: Error | null, result: InitResult) => void) => void;
        };
      }
    ).checkoutFormInitialize.create(req, (err, r) => {
      if (err) resolve({ status: "failure", errorMessage: err.message });
      else resolve(r);
    });
  });

  if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        errorMessage: result.errorMessage || "iyzico init hata",
      },
    });
    return NextResponse.json(
      { error: result.errorMessage || "Ödeme başlatılamadı" },
      { status: 502 },
    );
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerToken: result.token },
  });

  return NextResponse.json({
    paymentPageUrl: result.paymentPageUrl,
    paymentId: payment.id,
  });
}
