import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const replies = await prisma.autoReply.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(replies);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { trigger, response } = await request.json();
  if (!trigger || !response) {
    return NextResponse.json({ error: "Tetikleyici ve cevap zorunlu" }, { status: 400 });
  }

  const reply = await prisma.autoReply.create({
    data: { trigger, response, userId },
  });
  return NextResponse.json(reply);
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, trigger, response, isActive } = await request.json();

  const reply = await prisma.autoReply.updateMany({
    where: { id, userId },
    data: { trigger, response, isActive },
  });
  return NextResponse.json(reply);
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.autoReply.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
