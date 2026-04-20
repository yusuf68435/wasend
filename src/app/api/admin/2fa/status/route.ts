import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSkipTotp } from "@/lib/admin-guard";

export async function GET() {
  const admin = await requireSuperAdminSkipTotp();
  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpEnabled: true },
  });
  return NextResponse.json({ totpEnabled: !!user?.totpEnabled });
}
