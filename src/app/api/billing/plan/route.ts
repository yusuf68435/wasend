import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PLAN_LIMITS,
  getLimits,
  type Plan,
} from "@/lib/plan-limits";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
  const limits = getLimits(user?.plan);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [contactsUsed, broadcastsUsed, flowsUsed, aiTokensThisMonth] = await Promise.all([
    prisma.contact.count({ where: { userId } }),
    prisma.broadcast.count({
      where: {
        userId,
        status: { in: ["sent", "sending"] },
        createdAt: { gte: monthStart },
      },
    }),
    prisma.flow.count({ where: { userId } }),
    prisma.aIUsage
      .aggregate({
        where: {
          userId,
          date: { gte: monthStart.toISOString().slice(0, 10) },
        },
        _sum: { tokens: true },
      })
      .then((r) => r._sum.tokens ?? 0),
  ]);

  return NextResponse.json({
    plan: user?.plan || "STARTER",
    stripeCustomerId: user?.stripeCustomerId,
    stripeSubscriptionId: user?.stripeSubscriptionId,
    limits,
    usage: {
      contacts: contactsUsed,
      broadcastsThisMonth: broadcastsUsed,
      flows: flowsUsed,
      aiTokensThisMonth,
    },
    allPlans: PLAN_LIMITS,
  });
}

// Dev-mode plan switcher. In production this would be wired to Stripe
// subscription webhooks; for now it lets OWNER change plan directly.
// Set STRIPE_ENABLED=true in env once a real Stripe flow is wired up to
// disable this path.
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (process.env.STRIPE_ENABLED === "true") {
    return NextResponse.json(
      { error: "Plan değişikliği için Stripe portalını kullanın" },
      { status: 400 },
    );
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const plan = body.plan as Plan;
  if (!plan || !(plan in PLAN_LIMITS)) {
    return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "OWNER") {
    return NextResponse.json(
      { error: "Yalnızca hesap sahibi plan değiştirebilir" },
      { status: 403 },
    );
  }

  await prisma.user.update({ where: { id: userId }, data: { plan } });
  return NextResponse.json({ plan });
}
