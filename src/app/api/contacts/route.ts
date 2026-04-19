import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, formatZodError } from "@/lib/validation";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
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

  const parsed = contactCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const { name, phone, tags, notes } = parsed.data;

  try {
    const contact = await prisma.contact.create({
      data: { name, phone, tags: tags ?? null, notes: notes ?? null, userId },
    });
    return NextResponse.json(contact);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Kişi eklenemedi";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Bu telefon numarası zaten kayıtlı" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.contact.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
