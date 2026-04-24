import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Health check — /api/health
 *
 * İki sınıf check:
 *   - required: eksikse app çalışamaz → 503 degraded
 *   - optional: eksikse feature pasif kalır → 200 ok + "warning" bilgisi
 *
 * WhatsApp env opsiyoneldir (bkz. src/lib/env.ts). Müşteri henüz Meta
 * credentials girmediyse health "degraded" dönmemeli; sadece warning
 * olarak bildirilir. Böylece LB/uptime-monitor false positive almaz.
 */
type Check = { ok: boolean; latencyMs?: number; error?: string };

export async function GET() {
  const required: Record<string, Check> = {};
  const optional: Record<string, Check> = {};

  // DB (required)
  const dbStart = Date.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    required.db = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    required.db = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: e instanceof Error ? e.message : "unknown",
    };
  }

  // Cron secret (required — cron worker bunsuz çalışmaz)
  required.cronSecret = {
    ok: !!(process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET),
  };

  // WhatsApp env (optional — eksikse send API'ları 500 döner, app boot eder)
  optional.whatsappEnv = {
    ok: !!(
      process.env.WHATSAPP_API_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
    ),
  };

  const requiredOk = Object.values(required).every((c) => c.ok);
  const warnings = Object.entries(optional)
    .filter(([, c]) => !c.ok)
    .map(([k]) => k);

  return NextResponse.json(
    {
      status: requiredOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: { ...required, ...optional },
      ...(warnings.length ? { warnings } : {}),
    },
    { status: requiredOk ? 200 : 503 },
  );
}
