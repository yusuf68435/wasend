import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // DB
  const dbStart = Date.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.db = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.db = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: e instanceof Error ? e.message : "unknown",
    };
  }

  // Meta API reachability (lightweight — we only check env presence here to
  // avoid spamming Graph API on every health check)
  checks.whatsappEnv = {
    ok: !!process.env.WHATSAPP_API_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID,
  };

  checks.cronSecret = {
    ok: !!(process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET),
  };

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
