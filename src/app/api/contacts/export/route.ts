import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Papa from "papaparse";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      phone: true,
      tags: true,
      notes: true,
      language: true,
      source: true,
      optedOut: true,
      createdAt: true,
    },
  });

  const csv = Papa.unparse(
    contacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      tags: c.tags ?? "",
      notes: c.notes ?? "",
      language: c.language,
      source: c.source ?? "",
      optedOut: c.optedOut ? "1" : "0",
      createdAt: c.createdAt.toISOString(),
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
