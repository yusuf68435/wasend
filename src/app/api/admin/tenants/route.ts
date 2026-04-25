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
      onboardedAt: true,
      onboardingStep: true,
      phone: true,
      waApiToken: true,
      waAppSecret: true,
      waWabaId: true,
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

  // Hassas bilgileri client'a sızdırmadan, "var/yok" boolean'a indir
  const hasEnvCreds = !!(
    process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
  const sanitized = tenants.map((t) => {
    const userHasToken = !!t.waApiToken;
    const userHasPhone = !!t.phone;
    let waSource: "user" | "env" | "missing" = "missing";
    if (userHasToken && userHasPhone) waSource = "user";
    else if (hasEnvCreds && userHasPhone) waSource = "env";
    else if (hasEnvCreds) waSource = "env";
    const { waApiToken: _t, waAppSecret: _s, ...rest } = t;
    void _t;
    void _s;
    return {
      ...rest,
      waApiTokenSet: userHasToken,
      waAppSecretSet: !!t.waAppSecret,
      waSource,
    };
  });

  const hasMore = sanitized.length > limit;
  const items = hasMore ? sanitized.slice(0, limit) : sanitized;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ tenants: items, nextCursor });
}
