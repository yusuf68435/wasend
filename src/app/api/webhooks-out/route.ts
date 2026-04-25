import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outgoingWebhookSchema, formatZodError } from "@/lib/validation";
import { logTenantAction, getClientIp } from "@/lib/audit";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const hooks = await prisma.outgoingWebhook.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
      // Faz 8: health snapshot — UI'da kırmızı/yeşil göstergesi için
      lastDeliveredAt: true,
      lastStatusCode: true,
      lastError: true,
      // Faz 16: rotation grace period bilgisi (UI banner için)
      previousSecretValidUntil: true,
    },
  });
  return NextResponse.json(hooks);
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

  const parsed = outgoingWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const secret = crypto.randomBytes(24).toString("hex");

  const hook = await prisma.outgoingWebhook.create({
    data: {
      ...parsed.data,
      secret,
      userId,
    },
  });
  void logTenantAction({
    actorId: userId,
    action: "webhook.create",
    targetType: "OutgoingWebhook",
    targetId: hook.id,
    details: { name: hook.name, url: hook.url, events: hook.events },
    ip: getClientIp(request.headers),
  });
  return NextResponse.json({
    id: hook.id,
    name: hook.name,
    url: hook.url,
    events: hook.events,
    isActive: hook.isActive,
    secret,
    createdAt: hook.createdAt,
  });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { id?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.id || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "id ve isActive zorunlu" }, { status: 400 });
  }

  await prisma.outgoingWebhook.updateMany({
    where: { id: body.id, userId },
    data: { isActive: body.isActive },
  });
  void logTenantAction({
    actorId: userId,
    action: body.isActive ? "webhook.enable" : "webhook.disable",
    targetType: "OutgoingWebhook",
    targetId: body.id,
    ip: getClientIp(request.headers),
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const target = await prisma.outgoingWebhook.findFirst({
    where: { id, userId },
    select: { id: true, name: true, url: true },
  });
  await prisma.outgoingWebhook.deleteMany({ where: { id, userId } });
  if (target) {
    void logTenantAction({
      actorId: userId,
      action: "webhook.delete",
      targetType: "OutgoingWebhook",
      targetId: target.id,
      details: { name: target.name, url: target.url },
      ip: getClientIp(request.headers),
    });
  }
  return NextResponse.json({ success: true });
}
