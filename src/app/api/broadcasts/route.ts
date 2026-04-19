import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastCreateSchema, formatZodError } from "@/lib/validation";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const broadcasts = await prisma.broadcast.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(broadcasts);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = broadcastCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { name, message, targetTags, scheduledAt, rateLimit } = parsed.data;

  const status = scheduledAt ? "scheduled" : "draft";

  const broadcast = await prisma.broadcast.create({
    data: {
      name,
      message,
      targetTags: targetTags ?? null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      rateLimit: rateLimit ?? 80,
      status,
      userId,
    },
  });
  return NextResponse.json(broadcast);
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.broadcast.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
