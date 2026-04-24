import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchTemplateStatus } from "@/lib/meta-templates";
import { verifyCronAuth } from "@/lib/cron-auth";
import { resolveWACredentials } from "@/lib/wa-credentials";

export const maxDuration = 60;

// Polls Meta for pending template approval statuses. Schedule hourly in vercel.json.
// Per-tenant: her template'in sahibi user'ın WA token'ı ile poll edilir. Yoksa env fallback.
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) return auth.response!;

  const pending = await prisma.template.findMany({
    where: {
      status: "PENDING",
      metaId: { not: null },
    },
    take: 50,
  });

  const credCache = new Map<string, string | null>();
  async function getToken(userId: string): Promise<string | null> {
    const cached = credCache.get(userId);
    if (cached !== undefined) return cached;
    const { apiToken } = await resolveWACredentials(userId);
    credCache.set(userId, apiToken);
    return apiToken;
  }

  let updated = 0;
  for (const t of pending) {
    if (!t.metaId) continue;
    const token = await getToken(t.userId);
    if (!token) continue; // bu user'ın token'ı yok, skip
    try {
      const { status, reason } = await fetchTemplateStatus(t.metaId, token);
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
