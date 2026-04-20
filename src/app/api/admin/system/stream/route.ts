import os from "os";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE — sistem sağlığı canlı yayın.
 * 5 saniyede bir snapshot yayar. Heartbeat ile proxy timeout'ları engellenir.
 */

interface Snapshot {
  ts: number;
  db: {
    sizeHuman: string;
    connections: number;
    commits: number;
    rollbacks: number;
    tableCount: number;
  };
  host: {
    hostname: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
    loadAvg: number[];
    memTotalMB: number;
    memFreeMB: number;
    memUsagePct: number;
    cpuCount: number;
  };
  node: {
    version: string;
    uptimeSeconds: number;
    rssMB: number;
  };
  env: Record<string, boolean>;
  alerts: { failedMessages24h: number };
}

async function snapshot(): Promise<Snapshot> {
  const [dbSize, dbStats, tableCount, recentErrors] = await Promise.all([
    prisma
      .$queryRawUnsafe<{ size: string }[]>(
        "SELECT pg_size_pretty(pg_database_size(current_database())) AS size",
      )
      .catch(() => [{ size: "n/a" }]),
    prisma
      .$queryRawUnsafe<
        { numbackends: number; xact_commit: bigint; xact_rollback: bigint }[]
      >(
        "SELECT numbackends, xact_commit, xact_rollback FROM pg_stat_database WHERE datname = current_database()",
      )
      .catch(() => []),
    prisma
      .$queryRawUnsafe<{ count: bigint }[]>(
        "SELECT COUNT(*)::bigint AS count FROM pg_stat_user_tables",
      )
      .catch(() => [] as { count: bigint }[]),
    prisma.message.count({
      where: {
        status: "failed",
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
    }),
  ]);

  const dbStat = dbStats[0] ?? {
    numbackends: 0,
    xact_commit: BigInt(0),
    xact_rollback: BigInt(0),
  };

  const memTotal = os.totalmem();
  const memFree = os.freemem();

  return {
    ts: Date.now(),
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
      loadAvg: os.loadavg(),
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
    alerts: { failedMessages24h: recentErrors },
  };
}

export async function GET(request: Request) {
  const admin = await getSuperAdminOrNull();
  if (!admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const abort = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      request.signal.addEventListener("abort", abort);

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          abort();
        }
      }

      // İlk snapshot hemen
      try {
        send("snapshot", await snapshot());
      } catch {
        // yut — sonraki tick'te yeniden dener
      }

      const dataTimer = setInterval(async () => {
        if (closed) return;
        try {
          send("snapshot", await snapshot());
        } catch {
          // yut
        }
      }, 5000);

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          abort();
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(dataTimer);
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
