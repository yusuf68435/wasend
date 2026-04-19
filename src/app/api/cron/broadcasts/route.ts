import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processBroadcast } from "@/lib/broadcast-processor";

export const maxDuration = 300;

// Triggers scheduled broadcasts whose scheduledAt is due.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.broadcast.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    take: 5,
  });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const b of due) {
    try {
      await processBroadcast(b.id);
      results.push({ id: b.id, ok: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ id: b.id, ok: false, error: msg });
      await prisma.broadcast.update({
        where: { id: b.id },
        data: { status: "failed" },
      });
    }
  }

  return NextResponse.json({ processed: due.length, results });
}
