import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

/**
 * Failed message'ları temizle. Retry engelini kaldırır ya da görsel spam'ı temizler.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const result = await prisma.message.deleteMany({
    where: { userId: id, status: "failed" },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "tenant.clearFailed",
    targetType: "user",
    targetId: id,
    details: { email: user.email, deleted: result.count },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
