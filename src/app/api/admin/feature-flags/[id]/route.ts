import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { invalidateFeatureFlagCache } from "@/lib/feature-flags";

const patchSchema = z.object({
  description: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
  rolloutPct: z.number().int().min(0).max(100).optional(),
  targetPlans: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.update({
    where: { id },
    data: parsed.data,
  });
  invalidateFeatureFlagCache();

  await logAdminAction({
    actorId: admin.id,
    action: "feature-flag.update",
    targetType: "flag",
    targetId: id,
    details: { key: flag.key, ...parsed.data },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(flag);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const flag = await prisma.featureFlag.delete({ where: { id } });
  invalidateFeatureFlagCache();

  await logAdminAction({
    actorId: admin.id,
    action: "feature-flag.delete",
    targetType: "flag",
    targetId: id,
    details: { key: flag.key },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
