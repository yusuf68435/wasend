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

interface StatusCheck {
  name: string;
  state: "ok" | "degraded" | "down";
  detail?: string;
}

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

async function checkRecentErrors(): Promise<StatusCheck> {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const failures = await prisma.message.count({
      where: { status: "failed", createdAt: { gte: since } },
    });
    if (failures > 100) {
      return {
        name: "Mesaj Gönderimi",
        state: "degraded",
        detail: `Son saatte ${failures} başarısız mesaj`,
      };
    }
    return { name: "Mesaj Gönderimi", state: "ok", detail: `${failures} hata/saat` };
  } catch {
    return { name: "Mesaj Gönderimi", state: "degraded", detail: "kontrol edilemedi" };
  }
}

async function checkHost(): Promise<StatusCheck> {
  const load = os.loadavg()[0];
  const cpus = os.cpus().length;
  const pct = (load / cpus) * 100;
  if (pct > 90) return { name: "Sunucu", state: "degraded", detail: `CPU ${pct.toFixed(0)}%` };
  return { name: "Sunucu", state: "ok", detail: `CPU ${pct.toFixed(0)}%` };
}

function StateIcon({ state }: { state: StatusCheck["state"] }) {
  if (state === "ok") return <CheckCircle2 className="text-green-500" size={20} />;
  if (state === "degraded") return <AlertTriangle className="text-amber-500" size={20} />;
  return <XCircle className="text-red-500" size={20} />;
}

function StateBadge({ state }: { state: StatusCheck["state"] }) {
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

export default async function StatusPage() {
  const [db, messages, host] = await Promise.all([
    checkDatabase(),
    checkRecentErrors(),
    checkHost(),
  ]);

  const checks = [db, messages, host];
  const worst = checks.some((c) => c.state === "down")
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
          <StateIcon state={worst} />
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">{overallLabel}</h1>
          <p className="text-sm text-gray-600">
            Son kontrol: {new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
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

        <p className="text-center text-xs text-gray-400 mt-8">
          Bu sayfa her dakika canlı kontroller yapar. Kesinti durumunda{" "}
          <a href="mailto:destek@wasend.tech" className="text-green-600 underline">
            destek@wasend.tech
          </a>
          .
        </p>
      </main>
    </div>
  );
}
