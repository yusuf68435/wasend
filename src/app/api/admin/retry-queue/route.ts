import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

/**
 * Admin retry queue dashboard data.
 *
 * Döner:
 *   - stats: queue depth + son 24s sayılar (retry_pending, failed, sent)
 *   - dueNow: nextRetryAt <= now → cron birazdan alacak
 *   - upcoming: nextRetryAt > now → ileride denenecek
 *   - recentFailed: son 50 kalıcı failed (operasyonel görünürlük)
 *   - byUser: en yüksek queue depth'e sahip ilk 10 user
 */
export async function GET() {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86_400_000);

  const [
    pendingTotal,
    dueNowCount,
    failed24h,
    sent24h,
    dueMessages,
    upcomingMessages,
    recentFailed,
    byUserRaw,
  ] = await Promise.all([
    prisma.message.count({ where: { status: "retry_pending" } }),
    prisma.message.count({
      where: { status: "retry_pending", nextRetryAt: { lte: now } },
    }),
    prisma.message.count({
      where: { status: "failed", createdAt: { gte: dayAgo } },
    }),
    prisma.message.count({
      where: { status: "sent", createdAt: { gte: dayAgo } },
    }),
    prisma.message.findMany({
      where: { status: "retry_pending", nextRetryAt: { lte: now } },
      orderBy: { nextRetryAt: "asc" },
      take: 25,
      include: {
        user: { select: { email: true, name: true } },
        contact: { select: { name: true, phone: true } },
      },
    }),
    prisma.message.findMany({
      where: { status: "retry_pending", nextRetryAt: { gt: now } },
      orderBy: { nextRetryAt: "asc" },
      take: 25,
      include: {
        user: { select: { email: true, name: true } },
        contact: { select: { name: true, phone: true } },
      },
    }),
    prisma.message.findMany({
      where: { status: "failed", createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true, name: true } },
        contact: { select: { name: true, phone: true } },
      },
    }),
    prisma.message.groupBy({
      by: ["userId"],
      where: { status: "retry_pending" },
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  // Top users — userId → email/name resolve
  const userIds = byUserRaw.map((b) => b.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const byUser = byUserRaw.map((b) => {
    const u = userMap.get(b.userId);
    return {
      userId: b.userId,
      email: u?.email ?? null,
      name: u?.name ?? null,
      pendingCount: b._count._all,
    };
  });

  return NextResponse.json({
    stats: {
      pendingTotal,
      dueNow: dueNowCount,
      upcoming: pendingTotal - dueNowCount,
      failed24h,
      sent24h,
    },
    dueMessages,
    upcomingMessages,
    recentFailed,
    byUser,
  });
}
