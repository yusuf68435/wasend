import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchTemplateStatus } from "@/lib/meta-templates";

export const maxDuration = 60;

// Polls Meta for pending template approval statuses. Schedule hourly in vercel.json.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (!process.env.WHATSAPP_API_TOKEN) {
    return NextResponse.json({ processed: 0, note: "Meta API token yok" });
  }

  const pending = await prisma.template.findMany({
    where: {
      status: "PENDING",
      metaId: { not: null },
    },
    take: 50,
  });

  let updated = 0;
  for (const t of pending) {
    if (!t.metaId) continue;
    try {
      const { status, reason } = await fetchTemplateStatus(t.metaId);
      if (status !== t.status) {
        await prisma.template.update({
          where: { id: t.id },
          data: { status, rejection: reason },
        });
        updated++;
      }
    } catch (e) {
      console.error(`Template sync error for ${t.id}:`, e);
    }
  }

  return NextResponse.json({ processed: pending.length, updated });
}
