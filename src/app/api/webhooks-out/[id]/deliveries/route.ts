import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Faz 8: Webhook delivery log — customer entegrasyonunu debug etmek için
 * son N attempt'in durumu, status code'u, response time'ı ve hata mesajı.
 *
 * GET /api/webhooks-out/[id]/deliveries?limit=50&status=failed
 *   → { deliveries: [...], stats: {success24h, failed24h, p95ResponseMs} }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  // Webhook'un bu user'a ait olduğunu doğrula
  const hook = await prisma.outgoingWebhook.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!hook) {
    return NextResponse.json({ error: "Webhook bulunamadı" }, { status: 404 });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit")) || 50),
  );
  const statusFilter = url.searchParams.get("status");

  const where: import("@prisma/client").Prisma.WebhookDeliveryWhereInput = {
    webhookId: id,
  };
  if (statusFilter) where.status = statusFilter;

  const dayAgo = new Date(Date.now() - 86_400_000);

  const [deliveries, success24h, failed24h, recentForP95] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.webhookDelivery.count({
      where: { webhookId: id, status: "success", createdAt: { gte: dayAgo } },
    }),
    prisma.webhookDelivery.count({
      where: {
        webhookId: id,
        status: { in: ["failed", "timeout", "circuit_open"] },
        createdAt: { gte: dayAgo },
      },
    }),
    prisma.webhookDelivery.findMany({
      where: {
        webhookId: id,
        status: "success",
        responseTimeMs: { not: null },
        createdAt: { gte: dayAgo },
      },
      select: { responseTimeMs: true },
      take: 1000,
    }),
  ]);

  // p95 response time hesapla
  const times = recentForP95
    .map((d) => d.responseTimeMs)
    .filter((t): t is number => typeof t === "number")
    .sort((a, b) => a - b);
  const p95ResponseMs =
    times.length > 0 ? times[Math.floor(times.length * 0.95)] : null;

  return NextResponse.json({
    deliveries,
    stats: {
      success24h,
      failed24h,
      p95ResponseMs,
      total24h: success24h + failed24h,
      successRate24h:
        success24h + failed24h > 0
          ? success24h / (success24h + failed24h)
          : null,
    },
  });
}
