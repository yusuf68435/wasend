import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import {
  setImpersonationCookie,
  clearImpersonationCookie,
  readImpersonationCookie,
} from "@/lib/impersonation";
import { logAdminAction, getClientIp } from "@/lib/audit";

const startSchema = z.object({ userId: z.string().min(1) });

export async function POST(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { userId } = parsed.data;
  if (userId === admin.id) {
    return NextResponse.json(
      { error: "Kendi hesabınıza impersonate olamazsınız" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isSuperAdmin: true, deletedAt: true },
  });
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }
  if (target.isSuperAdmin) {
    return NextResponse.json(
      { error: "Başka bir süper admin'e impersonate olamazsınız" },
      { status: 400 },
    );
  }

  await setImpersonationCookie(target.id);
  await logAdminAction({
    actorId: admin.id,
    action: "impersonate.start",
    targetType: "user",
    targetId: target.id,
    details: { targetEmail: target.email },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, targetId: target.id, targetEmail: target.email });
}

export async function DELETE(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const imp = await readImpersonationCookie();
  await clearImpersonationCookie();

  if (imp) {
    await logAdminAction({
      actorId: admin.id,
      action: "impersonate.stop",
      targetType: "user",
      targetId: imp.userId,
      ip: getClientIp(request.headers),
    });
  }

  return NextResponse.json({ ok: true });
}
