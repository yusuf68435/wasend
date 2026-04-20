import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;

  const where: Prisma.SupportTicketWhereInput = {};
  if (status) where.status = status;

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
    include: {
      user: {
        select: { id: true, email: true, name: true, businessName: true, plan: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ tickets });
}
