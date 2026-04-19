import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsUpdateSchema, formatZodError } from "@/lib/validation";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      businessType: true,
      phone: true,
      timezone: true,
      businessHoursStart: true,
      businessHoursEnd: true,
      workDays: true,
      offHoursReply: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = settingsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: {
      businessName: true,
      businessType: true,
      phone: true,
      timezone: true,
      businessHoursStart: true,
      businessHoursEnd: true,
      workDays: true,
      offHoursReply: true,
    },
  });

  return NextResponse.json(user);
}
