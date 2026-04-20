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
  ]);

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
  });
}
