import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/lib/plan-limits";

const DAY_MS = 86_400_000;

/**
 * Faz 15: Tenant usage özetini döndürür.
 *   - Plan + limitler
 *   - Bu ayın kullanım sayıları (kişi, broadcast, flow, mesaj)
 *   - 30 günlük mesaj trendi (günlük outgoing sent count)
 *   - API key kullanımı (top 5)
 *   - Webhook teslim sağlığı (son 24 saat)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, createdAt: true },
  });
  const limits = getLimits(user?.plan);

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    contactCount,
    broadcastCount,
    flowCount,
    messagesSentMonth,
    messagesFailedMonth,
    apiKeys,
    webhookDeliverySuccess24h,
    webhookDeliveryFailed24h,
    dailyMessages,
  ] = await Promise.all([
    prisma.contact.count({ where: { userId } }),
    prisma.broadcast.count({
      where: {
        userId,
        status: { in: ["sent", "sending"] },
        createdAt: { gte: monthStart },
      },
    }),
    prisma.flow.count({ where: { userId } }),
    prisma.message.count({
      where: {
        userId,
        direction: "outgoing",
        status: "sent",
        createdAt: { gte: monthStart },
      },
    }),
    prisma.message.count({
      where: {
        userId,
        direction: "outgoing",
        status: "failed",
        createdAt: { gte: monthStart },
      },
    }),
    prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        usageCount: true,
        lastUsedAt: true,
      },
      orderBy: { usageCount: "desc" },
      take: 5,
    }),
    prisma.webhookDelivery.count({
      where: {
        webhook: { userId },
        status: "success",
        createdAt: { gte: dayAgo },
      },
    }),
    prisma.webhookDelivery.count({
      where: {
        webhook: { userId },
        status: { in: ["failed", "timeout", "circuit_open"] },
        createdAt: { gte: dayAgo },
      },
    }),
    prisma.message.findMany({
      where: {
        userId,
        direction: "outgoing",
        status: "sent",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),
  ]);

  // Günlük bucketlama
  const byDay = new Map<string, number>();
  for (const m of dailyMessages) {
    const key = new Date(m.createdAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const trend: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: byDay.get(key) ?? 0 });
  }

  return NextResponse.json({
    plan: user?.plan ?? "STARTER",
    limits,
    usage: {
      contactCount,
      broadcastsThisMonth: broadcastCount,
      flowCount,
      messagesSentThisMonth: messagesSentMonth,
      messagesFailedThisMonth: messagesFailedMonth,
    },
    trend,
    apiKeys: apiKeys.map((k) => ({
      ...k,
      scopes: (k.scopes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })),
    webhookHealth: {
      success24h: webhookDeliverySuccess24h,
      failed24h: webhookDeliveryFailed24h,
      successRate24h:
        webhookDeliverySuccess24h + webhookDeliveryFailed24h > 0
          ? webhookDeliverySuccess24h /
            (webhookDeliverySuccess24h + webhookDeliveryFailed24h)
          : null,
    },
    accountAgeDays: user?.createdAt
      ? Math.floor((Date.now() - user.createdAt.getTime()) / DAY_MS)
      : 0,
  });
}
