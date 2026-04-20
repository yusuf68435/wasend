import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

// Toggle super admin flag. Only existing super admin can promote/demote others.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;

  let body: { isSuperAdmin?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (typeof body.isSuperAdmin !== "boolean") {
    return NextResponse.json({ error: "isSuperAdmin boolean olmalı" }, { status: 400 });
  }

  // Safety: don't allow removing the last super admin
  if (!body.isSuperAdmin) {
    const superAdminCount = await prisma.user.count({ where: { isSuperAdmin: true } });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Son süper admini kaldıramazsınız" },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isSuperAdmin: body.isSuperAdmin },
    select: { id: true, email: true, isSuperAdmin: true },
  });

  await logAdminAction({
    actorId: admin.id,
    action: body.isSuperAdmin ? "admin.promote" : "admin.demote",
    targetType: "User",
    targetId: id,
    details: { email: updated.email },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(updated);
}
