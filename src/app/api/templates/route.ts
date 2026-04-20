import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { templateCreateSchema, formatZodError } from "@/lib/validation";
import { prismaErrorToResponse } from "@/lib/prisma-errors";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const templates = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
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

  const parsed = templateCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  try {
    const template = await prisma.template.create({
      data: {
        ...parsed.data,
        variables: parsed.data.variables ?? null,
        userId,
      },
    });
    return NextResponse.json(template);
  } catch (error) {
    const prismaResp = prismaErrorToResponse(error, {
      uniqueMessage: "Bu isim + dil kombinasyonu zaten var",
    });
    if (prismaResp) return prismaResp;
    const msg = error instanceof Error ? error.message : "Kaydedilemedi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.template.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
