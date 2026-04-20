import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, formatZodError } from "@/lib/validation";
import { checkContactQuota } from "@/lib/plan-limits";
import { prismaErrorToResponse } from "@/lib/prisma-errors";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(
    500,
    Math.max(1, Number(url.searchParams.get("limit")) || 200),
  );
  const cursor = url.searchParams.get("cursor") || undefined;
  const q = url.searchParams.get("q")?.trim();

  const where: import("@prisma/client").Prisma.ContactWhereInput = { userId };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = contacts.length > limit;
  const items = hasMore ? contacts.slice(0, limit) : contacts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ contacts: items, nextCursor });
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

  const quota = await checkContactQuota(userId);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason, limit: quota.limit, used: quota.used },
      { status: 402 },
    );
  }

  try {
    const contact = await prisma.contact.create({
      data: { name, phone, tags: tags ?? null, notes: notes ?? null, userId },
    });
    return NextResponse.json(contact);
  } catch (error) {
    const prismaResp = prismaErrorToResponse(error, {
      uniqueMessage: "Bu telefon numarası zaten kayıtlı",
    });
    if (prismaResp) return prismaResp;
    const msg = error instanceof Error ? error.message : "Kişi eklenemedi";
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
