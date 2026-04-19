import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") || "30";
  const days = Math.min(365, Math.max(1, Number(rangeParam) || 30));

  const now = new Date();
  const start = new Date(now.getTime() - days * 86400000);
  const startKey = toDateKey(start);

  const [stored, liveToday, totalContacts, activeFlows, pendingReminders, aiUsage7d] =
    await Promise.all([
      prisma.dailyMetric.findMany({
        where: { userId, date: { gte: startKey } },
        orderBy: { date: "asc" },
      }),
      (async () => {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const [sent, delivered, read, failed, incoming] = await Promise.all([
          prisma.message.count({
            where: {
              userId,
              direction: "outgoing",
              status: "sent",
              createdAt: { gte: todayStart },
            },
          }),
          prisma.message.count({
            where: { userId, deliveredAt: { gte: todayStart } },
          }),
          prisma.message.count({
            where: { userId, readAt: { gte: todayStart } },
          }),
          prisma.message.count({
            where: {
              userId,
              status: "failed",
              createdAt: { gte: todayStart },
            },
          }),
          prisma.message.count({
            where: {
              userId,
              direction: "incoming",
              createdAt: { gte: todayStart },
            },
          }),
        ]);
        return {
          date: toDateKey(todayStart),
          sent,
          delivered,
          read,
          failed,
          incomingCount: incoming,
          newContacts: 0,
          optOuts: 0,
        };
      })(),
      prisma.contact.count({ where: { userId, optedOut: false } }),
      prisma.flow.count({ where: { userId, isActive: true } }),
      prisma.reminder.count({ where: { userId, status: "pending" } }),
      (async () => {
        const cutoff = toDateKey(new Date(Date.now() - 7 * 86400000));
        const usages = await prisma.aIUsage.findMany({
          where: { userId, date: { gte: cutoff } },
          orderBy: { date: "asc" },
        });
        const totalTokens = usages.reduce((s, u) => s + u.tokens, 0);
        const totalCost = usages.reduce((s, u) => s + u.costUsd, 0);
        return { totalTokens, totalCost, series: usages };
      })(),
    ]);

  // Merge today's live data as the last point (overwrites stored if same date)
  const merged = [...stored.filter((s) => s.date !== liveToday.date), liveToday].sort(
    (a, b) => (a.date < b.date ? -1 : 1),
  );

  // Build aggregate totals over the range
  const totals = merged.reduce(
    (acc, m) => {
      acc.sent += m.sent;
      acc.delivered += m.delivered;
      acc.read += m.read;
      acc.failed += m.failed;
      acc.incomingCount += m.incomingCount;
      acc.newContacts += m.newContacts;
      acc.optOuts += m.optOuts;
      return acc;
    },
    {
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      incomingCount: 0,
      newContacts: 0,
      optOuts: 0,
    },
  );

  return NextResponse.json({
    range: days,
    series: merged,
    totals,
    snapshot: {
      totalContacts,
      activeFlows,
      pendingReminders,
    },
    ai: aiUsage7d,
  });
}
