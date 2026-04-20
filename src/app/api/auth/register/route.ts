import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isBootstrapAdminEmail } from "@/lib/admin-guard";

export async function POST(request: Request) {
  try {
    const { email, password, name, businessName, inviteToken } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, şifre ve isim zorunludur" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email zaten kayıtlı" },
        { status: 400 },
      );
    }

    let role = "OWNER";
    let invite: { id: string; email: string; role: string; expiresAt: Date } | null =
      null;
    if (inviteToken) {
      invite = await prisma.teamInvite.findUnique({
        where: { token: inviteToken },
        select: { id: true, email: true, role: true, expiresAt: true },
      });
      if (!invite) {
        return NextResponse.json(
          { error: "Davet bulunamadı" },
          { status: 400 },
        );
      }
      if (invite.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Davetin süresi dolmuş" },
          { status: 400 },
        );
      }
      if (invite.email.toLowerCase() !== String(email).toLowerCase()) {
        return NextResponse.json(
          { error: "Bu davet başka bir e-posta için oluşturulmuş" },
          { status: 400 },
        );
      }
      role = invite.role;
    }

    // OWASP 2024+ önerisi: bcrypt >= 12 round. Argon2id daha iyi; rotation sonra.
    const hashedPassword = await bcrypt.hash(password, 12);

    const isSuperAdmin = isBootstrapAdminEmail(email);

    const user = await prisma.user.create({
      data: { email, hashedPassword, name, businessName, role, isSuperAdmin },
    });

    if (invite) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
