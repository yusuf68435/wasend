import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

/**
 * GET: Ticket detay + mesajlar. Sahibi veya süper admin erişebilir.
 * POST: Yeni mesaj ekle (user veya admin).
 * DELETE: (yalnız kullanıcı) — ticket'ı kapalı olarak işaretler.
 */

async function getViewer(): Promise<
  { id: string; isSuperAdmin: boolean } | null
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    isSuperAdmin: !!session.user.isSuperAdmin,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, businessName: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ticket.userId !== viewer.id && !viewer.isSuperAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  return NextResponse.json({ ticket });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ticket.userId !== viewer.id && !viewer.isSuperAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
  }

  const role = viewer.isSuperAdmin && ticket.userId !== viewer.id ? "admin" : "user";

  await prisma.$transaction([
    prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        authorId: viewer.id,
        authorRole: role,
        body: parsed.data.body,
      },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: {
        status: role === "admin" ? "pending-user" : "open",
        updatedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  status: z.enum(["open", "pending-user", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ticket.userId !== viewer.id && !viewer.isSuperAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const closedAt = parsed.data.status === "closed" ? new Date() : null;
  await prisma.supportTicket.update({
    where: { id },
    data: { ...parsed.data, ...(closedAt ? { closedAt } : {}) },
  });

  return NextResponse.json({ ok: true });
}
