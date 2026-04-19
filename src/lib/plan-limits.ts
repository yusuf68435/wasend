import { prisma } from "@/lib/prisma";

export type Plan = "STARTER" | "PRO" | "BUSINESS";

export interface PlanLimits {
  contactLimit: number;
  broadcastsPerMonth: number;
  aiTokensPerMonth: number;
  flows: number;
  teamMembers: number;
  priceTry: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: {
    contactLimit: 500,
    broadcastsPerMonth: 10,
    aiTokensPerMonth: 100_000,
    flows: 3,
    teamMembers: 1,
    priceTry: 299,
  },
  PRO: {
    contactLimit: 5_000,
    broadcastsPerMonth: 100,
    aiTokensPerMonth: 1_000_000,
    flows: 20,
    teamMembers: 5,
    priceTry: 599,
  },
  BUSINESS: {
    contactLimit: 50_000,
    broadcastsPerMonth: 1_000,
    aiTokensPerMonth: 10_000_000,
    flows: 200,
    teamMembers: 25,
    priceTry: 999,
  },
};

export function getLimits(plan: string | null | undefined): PlanLimits {
  const p = (plan as Plan) || "STARTER";
  return PLAN_LIMITS[p] ?? PLAN_LIMITS.STARTER;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
}

export async function checkContactQuota(userId: string): Promise<QuotaCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const limits = getLimits(user?.plan);
  const used = await prisma.contact.count({ where: { userId } });
  if (used >= limits.contactLimit) {
    return {
      allowed: false,
      used,
      limit: limits.contactLimit,
      reason: `Kişi sayısı sınırına ulaşıldı (${limits.contactLimit}). Planınızı yükseltin.`,
    };
  }
  return { allowed: true, used, limit: limits.contactLimit };
}

export async function checkBroadcastQuota(userId: string): Promise<QuotaCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const limits = getLimits(user?.plan);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const used = await prisma.broadcast.count({
    where: {
      userId,
      status: { in: ["sent", "sending"] },
      createdAt: { gte: monthStart },
    },
  });
  if (used >= limits.broadcastsPerMonth) {
    return {
      allowed: false,
      used,
      limit: limits.broadcastsPerMonth,
      reason: `Aylık toplu mesaj sınırına ulaşıldı (${limits.broadcastsPerMonth}).`,
    };
  }
  return { allowed: true, used, limit: limits.broadcastsPerMonth };
}

export async function checkFlowQuota(userId: string): Promise<QuotaCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const limits = getLimits(user?.plan);
  const used = await prisma.flow.count({ where: { userId } });
  if (used >= limits.flows) {
    return {
      allowed: false,
      used,
      limit: limits.flows,
      reason: `Akış sayısı sınırına ulaşıldı (${limits.flows}).`,
    };
  }
  return { allowed: true, used, limit: limits.flows };
}
