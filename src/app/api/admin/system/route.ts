import { NextResponse } from "next/server";
import os from "os";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

export async function GET() {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const [dbSize, dbStats, tableCount, recentErrors] = await Promise.all([
    prisma.$queryRawUnsafe<{ size: string }[]>(
      "SELECT pg_size_pretty(pg_database_size(current_database())) AS size",
    ).catch(() => [{ size: "n/a" }]),
    prisma.$queryRawUnsafe<{ numbackends: number; xact_commit: bigint; xact_rollback: bigint }[]>(
      "SELECT numbackends, xact_commit, xact_rollback FROM pg_stat_database WHERE datname = current_database()",
    ).catch(() => []),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT COUNT(*)::bigint AS count FROM pg_stat_user_tables",
    ).catch(() => [] as { count: bigint }[]),
    prisma.message.count({
      where: {
        status: "failed",
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
    }),
  ]);

  const dbStat = dbStats[0] ?? {
    numbackends: 0,
    xact_commit: BigInt(0) as bigint,
    xact_rollback: BigInt(0) as bigint,
  };

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const loadAvg = os.loadavg();

  return NextResponse.json({
    db: {
      sizeHuman: dbSize[0]?.size ?? "n/a",
      connections: dbStat.numbackends,
      commits: Number(dbStat.xact_commit ?? BigInt(0)),
      rollbacks: Number(dbStat.xact_rollback ?? BigInt(0)),
      tableCount: Number(tableCount[0]?.count ?? BigInt(0)),
    },
    host: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: Math.round(os.uptime()),
      loadAvg,
      memTotalMB: Math.round(memTotal / 1024 / 1024),
      memFreeMB: Math.round(memFree / 1024 / 1024),
      memUsagePct: Math.round(((memTotal - memFree) / memTotal) * 100),
      cpuCount: os.cpus().length,
    },
    node: {
      version: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    env: {
      hasWhatsAppToken: !!process.env.WHATSAPP_API_TOKEN,
      hasWhatsAppPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasWhatsAppAppSecret: !!process.env.WHATSAPP_APP_SECRET,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasCronSecret: !!(process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET),
      stripeEnabled: process.env.STRIPE_ENABLED === "true",
    },
    alerts: {
      failedMessages24h: recentErrors,
    },
  });
}
