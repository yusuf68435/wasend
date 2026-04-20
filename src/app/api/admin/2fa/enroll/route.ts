import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSkipTotp } from "@/lib/admin-guard";
import { generateSecret, verifyToken, otpauthUrl, qrDataUrl } from "@/lib/totp";
import { setTotpCookie } from "@/lib/admin-totp-gate";
import { logAdminAction, getClientIp } from "@/lib/audit";

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
  const body = await request.json().catch(() => ({}));
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  if (!verifyToken(parsed.data.token, parsed.data.secret)) {
    return NextResponse.json({ error: "Kod doğrulanamadı" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { totpSecret: parsed.data.secret, totpEnabled: true },
  });
  await setTotpCookie(admin.id);

  await logAdminAction({
    actorId: admin.id,
    action: "admin.2fa.enrolled",
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
