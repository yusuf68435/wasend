import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSkipTotp } from "@/lib/admin-guard";
import { generateSecret, verifyToken, otpauthUrl, qrDataUrl } from "@/lib/totp";
import { setTotpCookie } from "@/lib/admin-totp-gate";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { encodeTotpSecret } from "@/lib/totp-secret";

/**
 * GET /api/admin/2fa/enroll — yeni secret üretir (sadece DB'ye yazmaz, UI'a döner)
 *   Döner: { secret, otpauth, qrDataUrl }
 *
 * POST /api/admin/2fa/enroll — kullanıcı app'te kodu gördü, 6 hane onayla
 *   Body: { secret, token }
 *   Başarılı: secret DB'ye yazılır, totpEnabled=true, cookie set edilir
 */

export async function GET() {
  const admin = await requireSuperAdminSkipTotp();
  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpEnabled: true },
  });
  if (user?.totpEnabled) {
    return NextResponse.json(
      { error: "2FA zaten etkin. Yeni kurulum için önce mevcut 2FA'yı kapatın." },
      { status: 409 },
    );
  }

  const secret = generateSecret();
  const otpauth = await otpauthUrl(admin.email, secret);
  const qr = await qrDataUrl(otpauth);
  return NextResponse.json({ secret, otpauth, qrDataUrl: qr });
}

const confirmSchema = z.object({
  secret: z.string().min(16),
  token: z.string().min(6).max(8),
});

export async function POST(request: Request) {
  const admin = await requireSuperAdminSkipTotp();
  const rateLimit = checkRateLimit(
    `admin:${admin.id}:2fa-enroll`,
    6,
    5 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      { error: "Çok fazla doğrulama denemesi" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!(await verifyToken(parsed.data.token, parsed.data.secret))) {
    return NextResponse.json({ error: "Kod doğrulanamadı" }, { status: 400 });
  }

  const storedSecret = encodeTotpSecret(parsed.data.secret);
  const result = await prisma.user.updateMany({
    where: { id: admin.id, totpEnabled: false },
    data: { totpSecret: storedSecret, totpEnabled: true },
  });
  if (result.count !== 1) {
    return NextResponse.json(
      { error: "2FA zaten etkin; mevcut kurulumun üzerine yazılamaz." },
      { status: 409 },
    );
  }
  await setTotpCookie(admin.id);

  await logAdminAction({
    actorId: admin.id,
    action: "admin.2fa.enrolled",
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
