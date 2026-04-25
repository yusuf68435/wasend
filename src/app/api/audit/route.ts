import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Faz 14: Tenant audit log — kullanıcının kendi resource'ları üzerinde
 * yaptığı eylemler. scope='tenant' AND actorId = me.
 *
 * GET /api/audit?limit=50&action=api_key.create
 *   → { logs: [...], hasMore }
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit")) || 50),
  );
  const actionFilter = url.searchParams.get("action") || undefined;

  const where: import("@prisma/client").Prisma.AdminAuditLogWhereInput = {
    scope: "tenant",
    actorId: userId,
  };
  if (actionFilter) where.action = actionFilter;

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      details: true,
      ip: true,
      createdAt: true,
    },
  });
  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;

  // details JSON parse — UI'da object olarak göster
  return NextResponse.json({
    logs: items.map((l) => ({
      ...l,
      details: l.details ? safeParse(l.details) : null,
    })),
    hasMore,
  });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
