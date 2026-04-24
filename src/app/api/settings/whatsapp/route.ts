/**
 * Per-tenant WhatsApp credentials endpoint — /api/settings/whatsapp
 *
 * GET → firma WA ayarlarının durumu (token var-yok, WABA ID, verify token).
 *      Token değerleri asla plaintext dönmez — sadece "set/empty" bilgisi.
 * PUT → credentials güncelle. Token'lar AES-GCM ile encrypted DB'ye yazılır.
 *
 * Güvenlik:
 *   - Token değerleri request'te plaintext gelir (HTTPS koruması); encrypted yazılır
 *   - GET yanıtında plaintext gösterilmez (masked)
 *   - verifyToken benzersiz (unique index) — başka firmanın verify token'ı denenirse rejected
 *   - Boş string → null'a çevrilir (alanı "temizle" anlamında)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret, maskSecret } from "@/lib/secret-crypto";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

const putSchema = z.object({
  waApiToken: z.string().trim().max(4000).optional().nullable(),
  waAppSecret: z.string().trim().max(200).optional().nullable(),
  waVerifyToken: z
    .string()
    .trim()
    .max(80)
    .regex(/^[A-Za-z0-9_\-]*$/, "verify token sadece harf/rakam/_/- içerebilir")
    .optional()
    .nullable(),
  waWabaId: z
    .string()
    .trim()
    .max(40)
    .regex(/^\d*$/, "WABA ID sadece rakam")
    .optional()
    .nullable(),
  phoneNumberId: z
    .string()
    .trim()
    .max(40)
    .regex(/^\d*$/, "Phone Number ID sadece rakam")
    .optional()
    .nullable(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      waApiToken: true,
      waAppSecret: true,
      waVerifyToken: true,
      waWabaId: true,
    },
  });
  if (!u) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  return NextResponse.json({
    phoneNumberId: u.phone || "",
    waWabaId: u.waWabaId || "",
    waVerifyToken: u.waVerifyToken || "",
    waApiTokenSet: !!u.waApiToken,
    waApiTokenMasked: maskSecret(u.waApiToken),
    waAppSecretSet: !!u.waAppSecret,
    waAppSecretMasked: maskSecret(u.waAppSecret),
  });
}

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const {
    waApiToken,
    waAppSecret,
    waVerifyToken,
    waWabaId,
    phoneNumberId,
  } = parsed.data;

  // Boş string → null (clear semantics). Undefined → dokunma.
  const data: Record<string, unknown> = {};

  if (waApiToken !== undefined) {
    data.waApiToken = waApiToken ? encryptSecret(waApiToken) : null;
  }
  if (waAppSecret !== undefined) {
    data.waAppSecret = waAppSecret ? encryptSecret(waAppSecret) : null;
  }
  if (waVerifyToken !== undefined) {
    data.waVerifyToken = waVerifyToken || null;
  }
  if (waWabaId !== undefined) {
    data.waWabaId = waWabaId || null;
  }
  if (phoneNumberId !== undefined) {
    data.phone = phoneNumberId || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  try {
    await prisma.user.update({ where: { id: userId }, data });
  } catch (e) {
    // Unique constraint (verify token çakışması)
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Bu verify token başka bir firma tarafından kullanılıyor." },
        { status: 409 },
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
