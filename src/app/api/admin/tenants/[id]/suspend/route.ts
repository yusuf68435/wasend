import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;

  let body: { suspend?: boolean; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  if (typeof body.suspend !== "boolean") {
    return NextResponse.json({ error: "suspend boolean olmalı" }, { status: 400 });
  }

  // Prevent admin from suspending themselves
  if (id === admin.id && body.suspend) {
    return NextResponse.json(
      { error: "Kendinizi askıya alamazsınız" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true, isSuperAdmin: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }
  if (target.isSuperAdmin && body.suspend) {
    return NextResponse.json(
      { error: "Başka bir süper admini askıya alamazsınız" },
      { status: 403 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      suspended: body.suspend,
      suspendedAt: body.suspend ? new Date() : null,
      suspendReason: body.suspend ? body.reason ?? null : null,
    },
    select: { id: true, email: true, suspended: true, suspendedAt: true },
  });

  await logAdminAction({
    actorId: admin.id,
    action: body.suspend ? "tenant.suspend" : "tenant.unsuspend",
    targetType: "User",
    targetId: id,
    details: { email: target.email, reason: body.reason ?? null },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(updated);
}
