import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tenant list CSV export — süper admin için.
 * Mevcut filtreleri aynen destekler (q/plan/status/sort).
 * Streaming yerine toplu çekiyor — normal tenant sayısında (< 100K) yeterli.
 */
export async function GET(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const plan = url.searchParams.get("plan") || undefined;
  const status = url.searchParams.get("status") || undefined;

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

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      businessType: true,
      phone: true,
      plan: true,
      suspended: true,
      isSuperAdmin: true,
      createdAt: true,
      lastSeenAt: true,
      _count: {
        select: {
          contacts: true,
          messages: true,
          broadcasts: true,
        },
      },
    },
  });

  const header = [
    "id",
    "email",
    "name",
    "businessName",
    "businessType",
    "phone",
    "plan",
    "suspended",
    "isSuperAdmin",
    "createdAt",
    "lastSeenAt",
    "contacts",
    "messages",
    "broadcasts",
  ];

  function escapeCsv(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" && v instanceof Date ? v.toISOString() : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [header.join(",")];
  for (const u of users) {
    lines.push(
      [
        u.id,
        u.email,
        u.name,
        u.businessName,
        u.businessType,
        u.phone,
        u.plan,
        u.suspended,
        u.isSuperAdmin,
        u.createdAt,
        u.lastSeenAt,
        u._count.contacts,
        u._count.messages,
        u._count.broadcasts,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  await logAdminAction({
    actorId: admin.id,
    action: "tenants.export",
    details: { count: users.length, filters: { q, plan, status } },
    ip: getClientIp(request.headers),
  });

  const filename = `wasend-tenants-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
