import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamInviteSchema, formatZodError } from "@/lib/validation";

async function getUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}

function requireAdmin(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!requireAdmin(user.role)) {
    return NextResponse.json({ error: "Yetersiz yetki" }, { status: 403 });
  }

  const invites = await prisma.teamInvite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Don't leak full tokens — return only last 6 chars
  return NextResponse.json(
    invites.map((i) => ({
      ...i,
      tokenPreview: i.token.slice(-8),
      token: undefined,
    })),
  );
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!requireAdmin(user.role)) {
    return NextResponse.json({ error: "Yetersiz yetki" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = teamInviteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);

  const invite = await prisma.teamInvite.create({
    data: {
      userId: user.id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token,
      expiresAt,
    },
  });

  const base = process.env.NEXTAUTH_URL || "";
  return NextResponse.json({
    ...invite,
    inviteUrl: `${base}/register?invite=${token}`,
  });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!requireAdmin(user.role)) {
    return NextResponse.json({ error: "Yetersiz yetki" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.teamInvite.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ success: true });
}
