import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  flowCreateSchema,
  flowUpdateSchema,
  formatZodError,
} from "@/lib/validation";
import { checkFlowQuota } from "@/lib/plan-limits";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

async function parseJson(request: Request) {
  try {
    return { ok: true as const, data: await request.json() };
  } catch {
    return { ok: false as const };
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const flows = await prisma.flow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(flows);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await parseJson(request);
  if (!body.ok) return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });

  const parsed = flowCreateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { name, trigger, triggerValue, nodes, isActive } = parsed.data;

  const quota = await checkFlowQuota(userId);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason, limit: quota.limit, used: quota.used },
      { status: 402 },
    );
  }

  const flow = await prisma.flow.create({
    data: {
      name,
      trigger,
      triggerValue: triggerValue ?? null,
      nodes,
      isActive: isActive ?? true,
      userId,
    },
  });
  return NextResponse.json(flow);
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await parseJson(request);
  if (!body.ok) return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });

  const parsed = flowUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { id, ...rest } = parsed.data;

  const data: Record<string, unknown> = {};
  if (rest.name !== undefined) data.name = rest.name;
  if (rest.trigger !== undefined) data.trigger = rest.trigger;
  if (rest.triggerValue !== undefined) data.triggerValue = rest.triggerValue ?? null;
  if (rest.nodes !== undefined) data.nodes = rest.nodes;
  if (rest.isActive !== undefined) data.isActive = rest.isActive;

  await prisma.flow.updateMany({ where: { id, userId }, data });
  const updated = await prisma.flow.findFirst({ where: { id, userId } });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.flow.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
