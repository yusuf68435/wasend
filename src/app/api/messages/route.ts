import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit")) || 100),
  );
  const cursor = url.searchParams.get("cursor") || undefined;
  const direction = url.searchParams.get("direction"); // "incoming" | "outgoing"
  const status = url.searchParams.get("status"); // "sent" | "delivered" | "read" | "failed"

  const where: import("@prisma/client").Prisma.MessageWhereInput = { userId };
  if (direction) where.direction = direction;
  if (status) where.status = status;

  const messages = await prisma.message.findMany({
    where,
    include: {
      contact: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return NextResponse.json({
    messages: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
