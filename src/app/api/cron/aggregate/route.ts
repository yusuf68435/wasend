import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Aggregates yesterday's counters per user into DailyMetric. Schedule 0 1 * * *.
// Idempotent: re-running on same day updates existing row.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  // Aggregate for "yesterday" in UTC. The per-user timezone is applied at query
  // time when charts are rendered; the raw bucket is UTC date.
  const now = new Date();
  const dayMs = 86400000;
  const targetDay = new Date(now.getTime() - dayMs);
  const start = new Date(Date.UTC(
    targetDay.getUTCFullYear(),
    targetDay.getUTCMonth(),
    targetDay.getUTCDate(),
    0, 0, 0, 0,
  ));
  const end = new Date(start.getTime() + dayMs);
  const dateKey = toDateKey(start);

  const users = await prisma.user.findMany({ select: { id: true } });

  let processed = 0;
  for (const u of users) {
    const [sent, delivered, read, failed, incoming, newContacts, optOuts] = await Promise.all([
      prisma.message.count({
        where: {
          userId: u.id,
          direction: "outgoing",
          status: "sent",
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.message.count({
        where: { userId: u.id, deliveredAt: { gte: start, lt: end } },
      }),
      prisma.message.count({
        where: { userId: u.id, readAt: { gte: start, lt: end } },
      }),
      prisma.message.count({
        where: {
          userId: u.id,
          status: "failed",
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.message.count({
        where: {
          userId: u.id,
          direction: "incoming",
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.contact.count({
        where: { userId: u.id, createdAt: { gte: start, lt: end } },
      }),
      prisma.contact.count({
        where: { userId: u.id, optOutAt: { gte: start, lt: end } },
      }),
    ]);

    await prisma.dailyMetric.upsert({
      where: { userId_date: { userId: u.id, date: dateKey } },
      update: {
        sent,
        delivered,
        read,
        failed,
        incomingCount: incoming,
        newContacts,
        optOuts,
      },
      create: {
        userId: u.id,
        date: dateKey,
        sent,
        delivered,
        read,
        failed,
        incomingCount: incoming,
        newContacts,
        optOuts,
      },
    });
    processed++;
  }

  return NextResponse.json({ processed, date: dateKey });
}
