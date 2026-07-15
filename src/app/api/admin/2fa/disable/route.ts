import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSkipTotp } from "@/lib/admin-guard";
import { verifyToken } from "@/lib/totp";
import { clearTotpCookie } from "@/lib/admin-totp-gate";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { decodeTotpSecret } from "@/lib/totp-secret";

const schema = z.object({
  token: z.string().min(6).max(8),
});

/**
 * 2FA devre dışı bırak — mevcut TOTP kodu doğrulanmalı.
 * Böylece kilidi olan biri başkası'nın oturumuyla 2FA kapatamaz.
 */
export async function POST(request: Request) {
  const admin = await requireSuperAdminSkipTotp();
  const rateLimit = checkRateLimit(
    `admin:${admin.id}:2fa-disable`,
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
    return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "2FA zaten kapalı" }, { status: 400 });
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

  await prisma.user.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpEnabled: false },
  });
  await clearTotpCookie();

  await logAdminAction({
    actorId: admin.id,
    action: "admin.2fa.disabled",
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
