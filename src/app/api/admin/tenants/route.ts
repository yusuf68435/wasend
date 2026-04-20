import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const plan = url.searchParams.get("plan") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const sort = url.searchParams.get("sort") || "createdAt";
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit")) || 50));
  const cursor = url.searchParams.get("cursor") || undefined;

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { businessName: { contains: q } },
      { phone: { contains: q } },
    ];
  }
  if (plan) where.plan = plan;
  if (status === "suspended") where.suspended = true;
  if (status === "active") where.suspended = false;

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "lastSeenAt"
      ? { lastSeenAt: { sort: "desc", nulls: "last" } }
      : sort === "email"
        ? { email: "asc" }
        : { createdAt: "desc" };

  const tenants = await prisma.user.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      plan: true,
      isSuperAdmin: true,
      suspended: true,
      suspendedAt: true,
      lastSeenAt: true,
      createdAt: true,
      _count: {
        select: {
          contacts: true,
          messages: true,
          broadcasts: true,
          flows: true,
        },
      },
    },
  });

  const hasMore = tenants.length > limit;
  const items = hasMore ? tenants.slice(0, limit) : tenants;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ tenants: items, nextCursor });
}
