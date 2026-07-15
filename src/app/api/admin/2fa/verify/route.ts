import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSkipTotp } from "@/lib/admin-guard";
import { verifyToken } from "@/lib/totp";
import { setTotpCookie } from "@/lib/admin-totp-gate";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { decodeTotpSecret, encodeTotpSecret } from "@/lib/totp-secret";

const schema = z.object({
  token: z.string().min(6).max(8),
});

export async function POST(request: Request) {
  const admin = await requireSuperAdminSkipTotp();
  const rateLimit = checkRateLimit(
    `admin:${admin.id}:2fa-verify`,
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz kod" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json(
      { error: "2FA aktif değil — önce enroll." },
      { status: 400 },
    );
  }

  const decoded = decodeTotpSecret(user.totpSecret);
  if (!decoded) {
    return NextResponse.json(
      { error: "2FA yapılandırması okunamadı" },
      { status: 500 },
    );
  }

  if (!(await verifyToken(parsed.data.token, decoded.secret))) {
    return NextResponse.json({ error: "Kod yanlış" }, { status: 400 });
  }

  if (decoded.needsMigration) {
    await prisma.user.updateMany({
      where: { id: admin.id, totpSecret: user.totpSecret },
      data: { totpSecret: encodeTotpSecret(decoded.secret) },
    });
  }

  await setTotpCookie(admin.id);

  await logAdminAction({
    actorId: admin.id,
    action: "admin.2fa.verify",
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
