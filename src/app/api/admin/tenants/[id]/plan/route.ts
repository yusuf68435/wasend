import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { PLAN_LIMITS, type Plan } from "@/lib/plan-limits";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;

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

  const before = await prisma.user.findUnique({
    where: { id },
    select: { email: true, plan: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { plan },
    select: { id: true, email: true, plan: true },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "tenant.plan.change",
    targetType: "User",
    targetId: id,
    details: { email: before.email, from: before.plan, to: plan },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(updated);
}
