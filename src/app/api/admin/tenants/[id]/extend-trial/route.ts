import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

const schema = z.object({
  days: z.number().int().min(1).max(365),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz gün sayısı" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Mevcut trialEndsAt varsa üstüne ekle, yoksa şu an + days
  const now = new Date();
  const base = user.trialEndsAt && user.trialEndsAt > now ? user.trialEndsAt : now;
  const newTrial = new Date(base.getTime() + parsed.data.days * 86400000);

  await prisma.user.update({
    where: { id },
    data: { trialEndsAt: newTrial },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "tenant.trial.extend",
    targetType: "user",
    targetId: id,
    details: { days: parsed.data.days, newTrialEndsAt: newTrial.toISOString() },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, trialEndsAt: newTrial.toISOString() });
}
