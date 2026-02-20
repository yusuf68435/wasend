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

  const reminders = await prisma.reminder.findMany({
    where: { userId },
    include: { contact: true },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(reminders);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { message, scheduledAt, contactId } = await request.json();
  if (!message || !scheduledAt || !contactId) {
    return NextResponse.json({ error: "Mesaj, tarih ve kişi zorunlu" }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: { message, scheduledAt: new Date(scheduledAt), contactId, userId },
  });
  return NextResponse.json(reminder);
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.reminder.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
