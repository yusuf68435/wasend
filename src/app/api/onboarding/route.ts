/**
 * Onboarding API — /api/onboarding
 *
 * GET   → kullanıcının wizard durumu (step, hangi şeyler yapılmış)
 * PATCH → adım ilerlet: { step, businessName?, businessType?, phoneNumberId? }
 * POST  → wizard'ı tamamla (onboardedAt = now)
 *         body { skip: true } → eksik adım kalsa da onboardedAt set,
 *         onboardingStep dokunulmaz (dashboard'da "tamamla" banner'ı için)
 *
 * Güvenlik: tüm endpoint'ler auth gerekli, kendi kaydını günceller.
 * Idempotent: PATCH aynı step tekrar POST edilebilir, sorun çıkmaz.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";

const TOTAL_STEPS = 4;

const patchSchema = z.object({
  step: z.number().int().min(0).max(TOTAL_STEPS).optional(),
  businessName: z.string().trim().min(1).max(120).optional(),
  businessType: z.string().trim().min(1).max(40).optional(),
  phoneNumberId: z
    .string()
    .trim()
    .regex(/^\d{10,20}$/, "Phone Number ID sadece rakam içermeli (10-20 basamak)")
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      businessType: true,
      phone: true,
      onboardedAt: true,
      onboardingStep: true,
    },
  });
  if (!u) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  return NextResponse.json({
    completed: !!u.onboardedAt,
    step: u.onboardingStep,
    totalSteps: TOTAL_STEPS,
    businessName: u.businessName || "",
    businessType: u.businessType || "",
    phoneNumberId: u.phone || "",
    // Skip-edilmiş kurulum: tamamlandı işaretli ama hâlâ eksik adımlar var
    skipped: !!u.onboardedAt && u.onboardingStep < TOTAL_STEPS,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const { step, businessName, businessType, phoneNumberId } = parsed.data;

  const data: Record<string, unknown> = {};
  if (businessName !== undefined) data.businessName = businessName;
  if (businessType !== undefined) data.businessType = businessType;
  if (phoneNumberId !== undefined) data.phone = phoneNumberId;
  if (step !== undefined) data.onboardingStep = step;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // body opsiyonel: { skip: true } → adımı bumpla, eksik kalsın
  let skip = false;
  try {
    const body = (await req.json().catch(() => null)) as { skip?: boolean } | null;
    skip = !!body?.skip;
  } catch {
    skip = false;
  }

  // Idempotent: zaten onboarded ise dokunma
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true, onboardingStep: true },
  });
  if (existing?.onboardedAt) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  await prisma.user.update({
    where: { id: userId },
    data: skip
      ? { onboardedAt: new Date() } // step dokunulmaz → "skipped" state
      : { onboardedAt: new Date(), onboardingStep: TOTAL_STEPS },
  });
  return NextResponse.json({ ok: true, skipped: skip });
}
