import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

/**
 * Admin-initiated şifre sıfırlama.
 * Reset token üretir, user'a eklenir, admin'e URL döner.
 * Admin bu URL'i user'a manuel iletir (email servisi opsiyonel olduğundan).
 * Token 24 saat geçerli.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  if (user.isSuperAdmin) {
    return NextResponse.json(
      { error: "Süper admin şifresi bu yoldan resetlenemez" },
      { status: 400 },
    );
  }

  const rawToken = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id },
    data: {
      passwordResetToken: hashed,
      passwordResetExpiresAt: expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://wasend.tech";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  await logAdminAction({
    actorId: admin.id,
    action: "tenant.password.reset",
    targetType: "user",
    targetId: id,
    details: { email: user.email, expiresAt: expiresAt.toISOString() },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({
    ok: true,
    resetUrl,
    expiresAt: expiresAt.toISOString(),
    note: "Bu URL 24 saat geçerli. Kullanıcıya güvenli kanaldan ilet.",
  });
}
