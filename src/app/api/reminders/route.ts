import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reminderCreateSchema, formatZodError } from "@/lib/validation";

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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = reminderCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { message, scheduledAt, contactId } = parsed.data;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) {
    return NextResponse.json({ error: "Kişi bulunamadı" }, { status: 404 });
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
