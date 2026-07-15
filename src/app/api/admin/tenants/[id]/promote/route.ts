import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

class LastSuperAdminError extends Error {}
class InvalidAdminTargetError extends Error {}

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

  let updated: { id: string; email: string; isSuperAdmin: boolean };
  try {
    updated = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id },
          select: {
            id: true,
            isSuperAdmin: true,
            suspended: true,
            deletedAt: true,
          },
        });
        if (!target) throw new InvalidAdminTargetError("not-found");
        if (body.isSuperAdmin && (target.suspended || target.deletedAt)) {
          throw new InvalidAdminTargetError("blocked");
        }

        if (target.isSuperAdmin && !body.isSuperAdmin) {
          const activeAdminCount = await tx.user.count({
            where: {
              isSuperAdmin: true,
              suspended: false,
              deletedAt: null,
            },
          });
          if (activeAdminCount <= 1) throw new LastSuperAdminError();
        }

        return tx.user.update({
          where: { id },
          data: { isSuperAdmin: body.isSuperAdmin },
          select: { id: true, email: true, isSuperAdmin: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof LastSuperAdminError) {
      return NextResponse.json(
        { error: "Son aktif süper admini kaldıramazsınız" },
        { status: 400 },
      );
    }
    if (error instanceof InvalidAdminTargetError) {
      const blocked = error.message === "blocked";
      return NextResponse.json(
        {
          error: blocked
            ? "Askıdaki veya silinmiş kullanıcı admin yapılamaz"
            : "Kullanıcı bulunamadı",
        },
        { status: blocked ? 400 : 404 },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Eşzamanlı admin değişikliği algılandı; tekrar deneyin" },
        { status: 409 },
      );
    }
    throw error;
  }

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
