import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits";

export async function GET() {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const now = new Date();
  const dayMs = 86400000;
  const dayAgo = new Date(now.getTime() - dayMs);
  const weekAgo = new Date(now.getTime() - 7 * dayMs);
  const monthAgo = new Date(now.getTime() - 30 * dayMs);

  const [
    tenantsTotal,
    tenantsActive7d,
    tenantsNew7d,
    tenantsSuspended,
    contactsTotal,
    messagesTotal,
    messagesToday,
    broadcastsTotal,
    flowsActive,
    aiSpend30d,
    byPlan,
    recentTenants,
    signups30d,
    messages30d,
    topTenantsByMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { suspended: true } }),
    prisma.contact.count(),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.broadcast.count(),
    prisma.flow.count({ where: { isActive: true } }),
    prisma.aIUsage.aggregate({
      where: { date: { gte: monthAgo.toISOString().slice(0, 10) } },
      _sum: { tokens: true, costUsd: true },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: { _all: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        plan: true,
        createdAt: true,
      },
    }),
    // 30-day signup series (fetch raw + groupBy in JS — db-agnostic)
    prisma.user.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
    // Top 10 by 7-day message count
    prisma.message.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: weekAgo } },
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  // Build daily series: fill in zero days
  function dailyBuckets(
    items: Array<{ createdAt: Date }>,
    days: number,
  ): Array<{ date: string; count: number }> {
    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - (days - 1 - i) * dayMs);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const it of items) {
      const key = it.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  }

  const dailySignups = dailyBuckets(signups30d, 30);
  const dailyMessages = dailyBuckets(messages30d, 30);

  // Enrich top tenants with user details
  const topTenantIds = topTenantsByMessages.map((t) => t.userId);
  const topTenantUsers =
    topTenantIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topTenantIds } },
          select: {
            id: true,
            email: true,
            name: true,
            businessName: true,
            plan: true,
          },
        })
      : [];
  const topTenants = topTenantsByMessages.map((t) => {
    const user = topTenantUsers.find((u) => u.id === t.userId);
    return {
      id: t.userId,
      email: user?.email ?? "—",
      name: user?.name ?? "—",
      businessName: user?.businessName ?? null,
      plan: user?.plan ?? "STARTER",
      messages7d: t._count._all,
    };
  });

  // MRR estimate from plan counts
  let mrrTry = 0;
  for (const row of byPlan) {
    const limits = PLAN_LIMITS[row.plan as Plan];
    if (limits) mrrTry += limits.priceTry * row._count._all;
  }

  return NextResponse.json({
    tenants: {
      total: tenantsTotal,
      active7d: tenantsActive7d,
      new7d: tenantsNew7d,
      suspended: tenantsSuspended,
    },
    usage: {
      contacts: contactsTotal,
      messagesTotal,
      messagesToday,
      broadcasts: broadcastsTotal,
      flowsActive,
    },
    revenue: {
      mrrTry,
      byPlan: byPlan.map((r) => ({ plan: r.plan, count: r._count._all })),
    },
    ai: {
      tokens30d: aiSpend30d._sum.tokens ?? 0,
      costUsd30d: aiSpend30d._sum.costUsd ?? 0,
    },
    recentTenants,
    dailySignups,
    dailyMessages,
    topTenants,
  });
}
