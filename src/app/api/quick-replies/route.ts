import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quickReplyCreateSchema, formatZodError } from "@/lib/validation";
import { prismaErrorToResponse } from "@/lib/prisma-errors";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const items = await prisma.quickReply.findMany({
    where: { userId },
    orderBy: { shortcut: "asc" },
  });
  return NextResponse.json(items);
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

  const parsed = quickReplyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  try {
    const item = await prisma.quickReply.create({
      data: {
        ...parsed.data,
        mediaUrl: parsed.data.mediaUrl ?? null,
        userId,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    const prismaResp = prismaErrorToResponse(error, {
      uniqueMessage: "Bu kısayol zaten kullanılıyor",
    });
    if (prismaResp) return prismaResp;
    const msg = error instanceof Error ? error.message : "Eklenemedi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.quickReply.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
