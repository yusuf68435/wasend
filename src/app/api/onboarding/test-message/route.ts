/**
 * Onboarding test mesajı — /api/onboarding/test-message
 *
 * Kullanıcının kendi numarasına bir test "Merhaba" mesajı gönderir, böylece
 * Phone Number ID + env token konfigürasyonunun çalıştığını doğrulatır.
 *
 * Giriş: { to: "+90xxx..." } (E.164 format)
 * Çıkış: { ok, waMessageId? } ya da { error }
 *
 * Rate limit: IP başına 5/dk (spam/flood önlem)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { formatZodError } from "@/lib/validation";
import { resolveWACredentials } from "@/lib/wa-credentials";

const bodySchema = z.object({
  to: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "Geçerli bir telefon numarası gir (E.164 formatı, örn. +905xxxxxxxxx)"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Rate limit — 5 test/dk
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = (xff.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  const rl = checkRateLimit(`onboarding-test:${ip}:${userId}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme — 1 dakika bekle." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { to } = parsed.data;

  // Per-user token + phone ID, yoksa env fallback (Phase A/C hybrid).
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const { apiToken, phoneNumberId } = await resolveWACredentials(userId);
  if (!phoneNumberId) {
    return NextResponse.json(
      { error: "Önce WhatsApp Phone Number ID'ni kaydet." },
      { status: 400 },
    );
  }
  if (!apiToken) {
    return NextResponse.json(
      {
        error:
          "WhatsApp API token'ı yapılandırılmamış. Ayarlar'dan kendi token'ını ekle veya yöneticiyle iletişime geç.",
      },
      { status: 503 },
    );
  }

  try {
    const firstName = u?.name?.split(" ")[0] || "oradaki";
    const result = await sendWhatsAppMessage({
      to,
      message: `Merhaba ${firstName}! 👋\n\nBu WaSend'den test mesajıdır. WhatsApp bağlantın başarıyla kuruldu, artık müşterilerine otomatik mesaj gönderebilirsin.`,
      phoneNumberId,
      apiToken,
    });
    return NextResponse.json({ ok: true, waMessageId: result.waMessageId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Mesaj gönderilemedi";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
