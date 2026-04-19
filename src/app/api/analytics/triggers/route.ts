import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns top 10 auto-reply triggers ordered by inferred engagement.
// Engagement is estimated by counting outgoing messages whose content equals the response text.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const replies = await prisma.autoReply.findMany({
    where: { userId },
    orderBy: { priority: "desc" },
    take: 50,
  });

  const result: Array<{ trigger: string; matches: number; active: boolean }> = [];
  for (const r of replies) {
    const matches = await prisma.message.count({
      where: {
        userId,
        direction: "outgoing",
        content: r.response,
      },
    });
    result.push({ trigger: r.trigger, matches, active: r.isActive });
  }

  result.sort((a, b) => b.matches - a.matches);
  return NextResponse.json({ triggers: result.slice(0, 10) });
}
