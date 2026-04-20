import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";
import { formatZodError } from "@/lib/validation";

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(4000),
  level: z.enum(["info", "warning", "critical", "success"]).default("info"),
  audience: z.enum(["all", "starter", "pro", "business"]).default("all"),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const items = await prisma.systemAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      createdBy: { select: { email: true, name: true } },
      _count: { select: { dismissals: true } },
    },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const item = await prisma.systemAnnouncement.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      level: parsed.data.level,
      audience: parsed.data.audience,
      isActive: parsed.data.isActive ?? true,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date(),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      createdById: admin.id,
    },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "announcement.create",
    targetType: "SystemAnnouncement",
    targetId: item.id,
    details: { title: item.title, level: item.level, audience: item.audience },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.systemAnnouncement.delete({ where: { id } });
  await logAdminAction({
    actorId: admin.id,
    action: "announcement.delete",
    targetType: "SystemAnnouncement",
    targetId: id,
    ip: getClientIp(request.headers),
  });
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let body: { id?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.id || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "id ve isActive zorunlu" }, { status: 400 });
  }

  const item = await prisma.systemAnnouncement.update({
    where: { id: body.id },
    data: { isActive: body.isActive },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "announcement.toggle",
    targetType: "SystemAnnouncement",
    targetId: item.id,
    details: { isActive: body.isActive },
    ip: getClientIp(request.headers),
  });
  return NextResponse.json(item);
}
