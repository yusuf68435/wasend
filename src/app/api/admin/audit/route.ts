import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit")) || 100));
  const cursor = url.searchParams.get("cursor") || undefined;
  const action = url.searchParams.get("action") || undefined;
  const actorEmail = url.searchParams.get("actor") || undefined;
  const targetId = url.searchParams.get("targetId") || undefined;
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;

  const where: Prisma.AdminAuditLogWhereInput = {};
  if (action) where.action = action;
  if (targetId) where.targetId = targetId;
  if (actorEmail) {
    where.actor = { email: { contains: actorEmail } };
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as { gte?: Date }).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as { lte?: Date }).lte = new Date(dateTo);
  }

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      actor: { select: { email: true, name: true } },
    },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;

  return NextResponse.json({
    logs: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
