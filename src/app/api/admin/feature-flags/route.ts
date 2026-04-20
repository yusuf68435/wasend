import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { invalidateFeatureFlagCache } from "@/lib/feature-flags";

const createSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, "küçük harf, rakam, _, - kullanabilirsin"),
  description: z.string().max(200).optional(),
  enabled: z.boolean().optional(),
  rolloutPct: z.number().int().min(0).max(100).optional(),
  targetPlans: z.string().optional(),
});

export async function GET() {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const flags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(flags);
}

export async function POST(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  try {
    const flag = await prisma.featureFlag.create({
      data: {
        key: parsed.data.key,
        description: parsed.data.description ?? null,
        enabled: parsed.data.enabled ?? false,
        rolloutPct: parsed.data.rolloutPct ?? 0,
        targetPlans: parsed.data.targetPlans ?? null,
      },
    });
    invalidateFeatureFlagCache();
    await logAdminAction({
      actorId: admin.id,
      action: "feature-flag.create",
      targetType: "flag",
      targetId: flag.id,
      details: { key: flag.key },
      ip: getClientIp(request.headers),
    });
    return NextResponse.json(flag);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "Bu key zaten var" }, { status: 409 });
    }
    throw e;
  }
}
