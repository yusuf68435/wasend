import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { formatZodError } from "@/lib/validation";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  suspend: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { ids, suspend, reason } = parsed.data;

  // Admin kendi kendini suspend edemez, başka super adminleri de edemez
  const filteredIds = ids.filter((id) => id !== admin.id);
  const superAdmins = suspend
    ? await prisma.user.findMany({
        where: { id: { in: filteredIds }, isSuperAdmin: true },
        select: { id: true },
      })
    : [];
  const protectedIds = new Set([
    admin.id,
    ...superAdmins.map((s) => s.id),
  ]);
  const targetIds = filteredIds.filter((id) => !protectedIds.has(id));

  const result = await prisma.user.updateMany({
    where: { id: { in: targetIds } },
    data: {
      suspended: suspend,
      suspendedAt: suspend ? new Date() : null,
      suspendReason: suspend ? reason ?? "Bulk işlem" : null,
    },
  });

  await logAdminAction({
    actorId: admin.id,
    action: suspend ? "tenant.bulk.suspend" : "tenant.bulk.unsuspend",
    targetType: "User",
    targetId: null,
    details: {
      count: result.count,
      reason,
      skippedIds: ids.length - targetIds.length,
    },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({
    updated: result.count,
    skipped: ids.length - targetIds.length,
  });
}
