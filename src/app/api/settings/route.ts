import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessName: true, businessType: true, phone: true },
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { businessName, businessType, phone } = await request.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { businessName, businessType, phone },
  });

  return NextResponse.json({
    businessName: user.businessName,
    businessType: user.businessType,
    phone: user.phone,
  });
}
