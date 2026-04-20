import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tenant-side: list active announcements applicable to current user (not dismissed,
// within start/end, audience matches). Lightweight — polled or fetched on dashboard mount.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const now = new Date();

  const active = await prisma.systemAnnouncement.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      AND: [
        {
          OR: [
            { audience: "all" },
            { audience: (user?.plan || "STARTER").toLowerCase() },
          ],
        },
      ],
      dismissals: { none: { userId } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      level: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ announcements: active });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  await prisma.announcementDismissal.upsert({
    where: { announcementId_userId: { announcementId: body.id, userId } },
    update: {},
    create: { announcementId: body.id, userId },
  });

  return NextResponse.json({ success: true });
}
