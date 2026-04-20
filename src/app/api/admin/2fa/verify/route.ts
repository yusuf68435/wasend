import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSkipTotp } from "@/lib/admin-guard";
import { verifyToken } from "@/lib/totp";
import { setTotpCookie } from "@/lib/admin-totp-gate";
import { logAdminAction, getClientIp } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(6).max(8),
});

export async function POST(request: Request) {
  const admin = await requireSuperAdminSkipTotp();
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

  if (!verifyToken(parsed.data.token, user.totpSecret)) {
    return NextResponse.json({ error: "Kod yanlış" }, { status: 400 });
  }

  await setTotpCookie(admin.id);

  await logAdminAction({
    actorId: admin.id,
    action: "admin.2fa.verify",
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
