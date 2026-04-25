import { prisma } from "@/lib/prisma";
import os from "os";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata = {
  title: "Sistem Durumu",
  description: "WaSend servislerinin canlı durumu.",
};

type State = "ok" | "degraded" | "down";

interface StatusCheck {
  name: string;
  state: State;
  detail?: string;
}

interface DayBucket {
  date: string;
  state: State;
  failureRate: number;
  total: number;
}

interface Incident {
  startedAt: Date;
  durationMin: number;
  severity: "degraded" | "down";
  cause: string;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

async function checkDatabase(): Promise<StatusCheck> {
  try {
    const start = Date.now();
    await prisma.$queryRawUnsafe<{ ok: number }[]>("SELECT 1 AS ok");
    const ms = Date.now() - start;
    if (ms > 500) return { name: "Veritabanı", state: "degraded", detail: `${ms}ms` };
    return { name: "Veritabanı", state: "ok", detail: `${ms}ms` };
  } catch (e) {
    return {
      name: "Veritabanı",
      state: "down",
      detail: e instanceof Error ? e.message.slice(0, 60) : "bilinmiyor",
    };
  }
}

/**
 * Faz 10: Mesaj gönderim sağlığı son 1 saatlik başarı oranına göre.
 * - %99+ → ok
 * - %95-99 → degraded
 * - <%95 ve >50 attempt → down
 */
async function checkMessages(): Promise<StatusCheck & { successRate?: number }> {
  try {
    const since = new Date(Date.now() - HOUR_MS);
    const [success, failed] = await Promise.all([
      prisma.message.count({
        where: { status: "sent", createdAt: { gte: since } },
      }),
      prisma.message.count({
        where: { status: "failed", createdAt: { gte: since } },
      }),
    ]);
    const total = success + failed;
    if (total === 0) {
      return { name: "Mesaj Gönderimi", state: "ok", detail: "Trafik yok" };
    }
    const successRate = success / total;
    if (successRate < 0.95 && total > 50) {
      return {
        name: "Mesaj Gönderimi",
        state: "down",
        detail: `Başarı %${(successRate * 100).toFixed(1)}`,
        successRate,
      };
    }
    if (successRate < 0.99) {
      return {
        name: "Mesaj Gönderimi",
        state: "degraded",
        detail: `Başarı %${(successRate * 100).toFixed(1)}`,
        successRate,
      };
    }
    return {
      name: "Mesaj Gönderimi",
      state: "ok",
      detail: `Başarı %${(successRate * 100).toFixed(1)}`,
      successRate,
    };
  } catch {
    return { name: "Mesaj Gönderimi", state: "degraded", detail: "kontrol edilemedi" };
  }
}

/**
 * Faz 10: Webhook delivery health (son 1 saat).
 * Aggregated across tüm tenant; sadece public health sinyali için.
 */
async function checkWebhooks(): Promise<StatusCheck & { successRate?: number }> {
  try {
    const since = new Date(Date.now() - HOUR_MS);
    const [success, failed] = await Promise.all([
      prisma.webhookDelivery.count({
        where: { status: "success", createdAt: { gte: since } },
      }),
      prisma.webhookDelivery.count({
        where: {
          status: { in: ["failed", "timeout", "circuit_open"] },
          createdAt: { gte: since },
        },
      }),
    ]);
    const total = success + failed;
    if (total === 0) {
      return { name: "Webhook Teslimi", state: "ok", detail: "Trafik yok" };
    }
    const successRate = success / total;
    if (successRate < 0.9 && total > 20) {
      return {
        name: "Webhook Teslimi",
        state: "down",
        detail: `Başarı %${(successRate * 100).toFixed(1)}`,
        successRate,
      };
    }
    if (successRate < 0.97) {
      return {
        name: "Webhook Teslimi",
        state: "degraded",
        detail: `Başarı %${(successRate * 100).toFixed(1)}`,
        successRate,
      };
    }
    return {
      name: "Webhook Teslimi",
      state: "ok",
      detail: `Başarı %${(successRate * 100).toFixed(1)}`,
      successRate,
    };
  } catch {
    return { name: "Webhook Teslimi", state: "degraded", detail: "kontrol edilemedi" };
  }
}

async function checkHost(): Promise<StatusCheck> {
  const load = os.loadavg()[0];
  const cpus = os.cpus().length;
  const pct = (load / cpus) * 100;
  if (pct > 90) return { name: "Sunucu", state: "degraded", detail: `CPU ${pct.toFixed(0)}%` };
  return { name: "Sunucu", state: "ok", detail: `CPU ${pct.toFixed(0)}%` };
}

/**
 * Faz 10: Son 30 günün günlük mesaj başarı oranını hesapla — uptime grafiği için.
 *  - <%95 → down (kırmızı)
 *  - <%99 → degraded (sarı)
 *  - geri kalan → ok (yeşil)
 *  - hiç trafik yok → "no-data" (gri) → ok kabul ediyoruz
 */
async function getDailyUptime(): Promise<DayBucket[]> {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * DAY_MS);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.message.findMany({
    where: {
      createdAt: { gte: start },
      status: { in: ["sent", "failed"] },
    },
    select: { createdAt: true, status: true },
  });

  const byDay = new Map<string, { ok: number; bad: number }>();
  for (const r of rows) {
    const d = new Date(r.createdAt);
    const key = d.toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? { ok: 0, bad: 0 };
    if (r.status === "sent") bucket.ok++;
    else bucket.bad++;
    byDay.set(key, bucket);
  }

  const out: DayBucket[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const b = byDay.get(key);
    if (!b || b.ok + b.bad === 0) {
      out.push({ date: key, state: "ok", failureRate: 0, total: 0 });
      continue;
    }
    const total = b.ok + b.bad;
    const fr = b.bad / total;
    let state: State = "ok";
    if (fr >= 0.05) state = "down";
    else if (fr >= 0.01) state = "degraded";
    out.push({ date: key, state, failureRate: fr, total });
  }
  return out;
}

/**
 * Faz 10: Son 7 gündeki "olay"ları çıkar — saatlik bucket'larda %5+
 * mesaj failure veya %10+ webhook failure olduğunda incident say.
 * Ardışık problemli saatleri tek bir incident olarak grupla.
 */
async function getIncidents(): Promise<Incident[]> {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * DAY_MS);
  start.setMinutes(0, 0, 0);

  const [msgs, hooks] = await Promise.all([
    prisma.message.findMany({
      where: {
        createdAt: { gte: start },
        status: { in: ["sent", "failed"] },
      },
      select: { createdAt: true, status: true },
    }),
    prisma.webhookDelivery.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, status: true },
    }),
  ]);

  const buckets = new Map<
    number,
    { msgOk: number; msgBad: number; hookOk: number; hookBad: number }
  >();
  const bucketOf = (d: Date) => Math.floor(d.getTime() / HOUR_MS) * HOUR_MS;

  for (const m of msgs) {
    const k = bucketOf(new Date(m.createdAt));
    const b = buckets.get(k) ?? { msgOk: 0, msgBad: 0, hookOk: 0, hookBad: 0 };
    if (m.status === "sent") b.msgOk++;
    else b.msgBad++;
    buckets.set(k, b);
  }
  for (const h of hooks) {
    const k = bucketOf(new Date(h.createdAt));
    const b = buckets.get(k) ?? { msgOk: 0, msgBad: 0, hookOk: 0, hookBad: 0 };
    if (h.status === "success") b.hookOk++;
    else b.hookBad++;
    buckets.set(k, b);
  }

  // Saatleri sırala
  const sorted = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  const incidents: Incident[] = [];
  let current: { startMs: number; lastMs: number; severity: State; cause: string } | null = null;

  for (const [ts, b] of sorted) {
    const msgTotal = b.msgOk + b.msgBad;
    const hookTotal = b.hookOk + b.hookBad;
    const msgFr = msgTotal >= 20 ? b.msgBad / msgTotal : 0;
    const hookFr = hookTotal >= 10 ? b.hookBad / hookTotal : 0;

    let severity: State = "ok";
    let cause = "";
    if (msgFr >= 0.2) {
      severity = "down";
      cause = `Mesaj gönderim hatası %${(msgFr * 100).toFixed(0)}`;
    } else if (msgFr >= 0.05) {
      severity = "degraded";
      cause = `Mesaj gönderim yavaşlığı %${(msgFr * 100).toFixed(0)}`;
    } else if (hookFr >= 0.3) {
      severity = "down";
      cause = `Webhook teslim hatası %${(hookFr * 100).toFixed(0)}`;
    } else if (hookFr >= 0.1) {
      severity = "degraded";
      cause = `Webhook gecikme %${(hookFr * 100).toFixed(0)}`;
    }

    if (severity === "ok") {
      // gap → mevcut incident'ı kapat
      if (current) {
        incidents.push({
          startedAt: new Date(current.startMs),
          durationMin: Math.round((current.lastMs + HOUR_MS - current.startMs) / 60_000),
          severity: current.severity === "down" ? "down" : "degraded",
          cause: current.cause,
        });
        current = null;
      }
      continue;
    }

    // ardışık ise extend, yoksa yeni başlat
    if (current && ts - current.lastMs <= HOUR_MS) {
      current.lastMs = ts;
      // En kötüsü severity'i belirler
      if (severity === "down") current.severity = "down";
      // En son neden
      current.cause = cause;
    } else {
      if (current) {
        incidents.push({
          startedAt: new Date(current.startMs),
          durationMin: Math.round((current.lastMs + HOUR_MS - current.startMs) / 60_000),
          severity: current.severity === "down" ? "down" : "degraded",
          cause: current.cause,
        });
      }
      current = { startMs: ts, lastMs: ts, severity, cause };
    }
  }
  if (current) {
    incidents.push({
      startedAt: new Date(current.startMs),
      durationMin: Math.round((current.lastMs + HOUR_MS - current.startMs) / 60_000),
      severity: current.severity === "down" ? "down" : "degraded",
      cause: current.cause,
    });
  }

  // En yeni → en eski; max 10
  return incidents.reverse().slice(0, 10);
}

function StateIcon({ state }: { state: State }) {
  if (state === "ok") return <CheckCircle2 className="text-green-500" size={20} />;
  if (state === "degraded") return <AlertTriangle className="text-amber-500" size={20} />;
  return <XCircle className="text-red-500" size={20} />;
}

function StateBadge({ state }: { state: State }) {
  const label = state === "ok" ? "Çalışıyor" : state === "degraded" ? "Yavaş" : "Hizmet dışı";
  const cls =
    state === "ok"
      ? "bg-green-50 text-green-700 border-green-200"
      : state === "degraded"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{label}</span>
  );
}

function dayClass(state: State) {
  if (state === "ok") return "bg-green-500";
  if (state === "degraded") return "bg-amber-400";
  return "bg-red-500";
}

export default async function StatusPage() {
  const [db, messages, webhooks, host, daily, incidents] = await Promise.all([
    checkDatabase(),
    checkMessages(),
    checkWebhooks(),
    checkHost(),
    getDailyUptime(),
    getIncidents(),
  ]);

  const checks: StatusCheck[] = [db, messages, webhooks, host];
  const worst: State = checks.some((c) => c.state === "down")
    ? "down"
    : checks.some((c) => c.state === "degraded")
      ? "degraded"
      : "ok";

  const overallLabel =
    worst === "ok"
      ? "Tüm sistemler çalışıyor"
      : worst === "degraded"
        ? "Bazı servislerde performans düşüklüğü"
        : "Hizmet kesintisi";

  // 30 günlük genel uptime % (hata oranlarının ortalaması)
  const daysWithTraffic = daily.filter((d) => d.total > 0);
  const uptime30d =
    daysWithTraffic.length > 0
      ? 1 -
        daysWithTraffic.reduce((s, d) => s + d.failureRate, 0) /
          daysWithTraffic.length
      : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-green-600">
            WaSend
          </Link>
          <span className="text-sm text-gray-500">Sistem Durumu</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div
          className={
            "rounded-2xl p-8 text-center mb-8 " +
            (worst === "ok"
              ? "bg-green-50 border border-green-200"
              : worst === "degraded"
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200")
          }
        >
          <div className="flex justify-center mb-4">
            <StateIcon state={worst} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{overallLabel}</h1>
          <p className="text-sm text-gray-600">
            Son kontrol:{" "}
            {new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
          </p>
        </div>

        {/* Servis durumları */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-8">
          {checks.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <StateIcon state={c.state} />
                <span className="font-medium text-gray-900">{c.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {c.detail && (
                  <span className="text-xs text-gray-500">{c.detail}</span>
                )}
                <StateBadge state={c.state} />
              </div>
            </div>
          ))}
        </div>

        {/* 30 günlük uptime grafiği */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Son 30 Gün</h2>
            <div className="text-sm text-gray-600">
              Uptime{" "}
              <span className="font-semibold text-green-600">
                %{(uptime30d * 100).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-1 items-end h-12">
            {daily.map((d) => (
              <div
                key={d.date}
                title={`${d.date} — ${
                  d.total === 0
                    ? "trafik yok"
                    : `başarı %${((1 - d.failureRate) * 100).toFixed(1)} (${d.total} mesaj)`
                }`}
                className={`flex-1 rounded-sm h-full ${
                  d.total === 0 ? "bg-gray-200" : dayClass(d.state)
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-2">
            <span>{daily[0]?.date}</span>
            <span>Bugün</span>
          </div>
        </div>

        {/* Olay geçmişi */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Son 7 Gün — Olay Geçmişi
          </h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Son 7 günde kayda değer bir olay yok 🎉
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {incidents.map((i, idx) => (
                <li
                  key={idx}
                  className="py-3 flex items-start gap-3"
                >
                  <StateIcon state={i.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {i.cause}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {i.startedAt.toLocaleString("tr-TR", {
                        timeZone: "Europe/Istanbul",
                      })}{" "}
                      — süre: {i.durationMin} dk
                    </div>
                  </div>
                  <StateBadge state={i.severity} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Bu sayfa her dakika canlı kontroller yapar. Kesinti durumunda{" "}
          <a
            href="mailto:destek@wasend.tech"
            className="text-green-600 underline"
          >
            destek@wasend.tech
          </a>
          .
        </p>
      </main>
    </div>
  );
}
