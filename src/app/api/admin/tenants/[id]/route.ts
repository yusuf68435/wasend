import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      businessName: true,
      businessType: true,
      phone: true,
      timezone: true,
      plan: true,
      role: true,
      isSuperAdmin: true,
      suspended: true,
      suspendedAt: true,
      suspendReason: true,
      aiEnabled: true,
      aiModel: true,
      aiDailyTokenLimit: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          contacts: true,
          messages: true,
          broadcasts: true,
          flows: true,
          templates: true,
          segments: true,
          apiKeys: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const [recentMessages, aiUsage30d, recentBroadcasts] = await Promise.all([
    prisma.message.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        direction: true,
        status: true,
        phone: true,
        content: true,
        createdAt: true,
      },
    }),
    prisma.aIUsage.aggregate({
      where: { userId: id, date: { gte: monthAgo.toISOString().slice(0, 10) } },
      _sum: { tokens: true, costUsd: true },
    }),
    prisma.broadcast.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        sentCount: true,
        failedCount: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    user,
    recentMessages,
    recentBroadcasts,
    ai: {
      tokens30d: aiUsage30d._sum.tokens ?? 0,
      costUsd30d: aiUsage30d._sum.costUsd ?? 0,
    },
  });
}
