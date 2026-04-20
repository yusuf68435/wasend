import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(5).max(5000),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: parsed.data.subject,
      priority: parsed.data.priority ?? "normal",
      messages: {
        create: {
          authorId: userId,
          authorRole: "user",
          body: parsed.data.body,
        },
      },
    },
  });

  return NextResponse.json({ id: ticket.id });
}
