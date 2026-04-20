import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchTemplateStatus } from "@/lib/meta-templates";
import { verifyCronAuth } from "@/lib/cron-auth";

export const maxDuration = 60;

// Polls Meta for pending template approval statuses. Schedule hourly in vercel.json.
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) return auth.response!;

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
