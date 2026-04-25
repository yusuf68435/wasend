"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Megaphone,
  GitBranch,
  Send,
  Zap,
  Webhook,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface UsageResponse {
  plan: string;
  limits: {
    contactLimit: number;
    broadcastsPerMonth: number;
    aiTokensPerMonth: number;
    flows: number;
    teamMembers: number;
    priceTry: number;
  };
  usage: {
    contactCount: number;
    broadcastsThisMonth: number;
    flowCount: number;
    messagesSentThisMonth: number;
    messagesFailedThisMonth: number;
  };
  trend: Array<{ date: string; count: number }>;
  apiKeys: Array<{
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    usageCount: number;
    lastUsedAt: string | null;
  }>;
  webhookHealth: {
    success24h: number;
    failed24h: number;
    successRate24h: number | null;
  };
  accountAgeDays: number;
}

const PLAN_LABEL: Record<string, string> = {
  STARTER: "Başlangıç",
  PRO: "Pro",
  BUSINESS: "Kurumsal",
};

const PLAN_TONE: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  PRO: "bg-blue-100 text-blue-700",
  BUSINESS: "bg-purple-100 text-purple-700",
};

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function progressTone(p: number): string {
  if (p >= 90) return "bg-red-500";
  if (p >= 70) return "bg-amber-500";
  return "bg-green-500";
}

export default function UsagePage() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        setData(j);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">Yükleniyor...</div>
    );
  }
  if (!data) {
    return (
      <div className="text-center py-16 text-red-500">Yüklenemedi</div>
    );
  }

  const planLabel = PLAN_LABEL[data.plan] ?? data.plan;
  const maxTrend = Math.max(...data.trend.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
            <TrendingUp size={20} /> Kullanım
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Bu ay ne kadar tükettiniz, planınız ne kadarına izin veriyor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              PLAN_TONE[data.plan] ?? PLAN_TONE.STARTER
            }`}
          >
            {planLabel} planı
          </span>
          <Link
            href="/dashboard/billing"
            className="text-sm text-green-600 underline"
          >
            Plan değiştir →
          </Link>
        </div>
      </div>

      {/* Quota cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuotaCard
          icon={Users}
          label="Kişiler"
          used={data.usage.contactCount}
          limit={data.limits.contactLimit}
          unit=""
        />
        <QuotaCard
          icon={Megaphone}
          label="Toplu mesaj (bu ay)"
          used={data.usage.broadcastsThisMonth}
          limit={data.limits.broadcastsPerMonth}
          unit=""
        />
        <QuotaCard
          icon={GitBranch}
          label="Akışlar"
          used={data.usage.flowCount}
          limit={data.limits.flows}
          unit=""
        />
        <QuotaCard
          icon={Zap}
          label="AI token (aylık)"
          used={0}
          limit={data.limits.aiTokensPerMonth}
          unit=""
          // TODO: ai usage tracking
          subtext="Yakında"
        />
      </div>

      {/* Messages this month + trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 inline-flex items-center gap-2">
              <Send size={16} /> Mesaj Trendi (son 30 gün)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Bu ay başarılı:{" "}
              <strong className="text-green-700">
                {data.usage.messagesSentThisMonth.toLocaleString("tr-TR")}
              </strong>
              {data.usage.messagesFailedThisMonth > 0 && (
                <>
                  {" "}
                  · başarısız:{" "}
                  <strong className="text-red-700">
                    {data.usage.messagesFailedThisMonth.toLocaleString("tr-TR")}
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-1 items-end h-24">
          {data.trend.map((t) => {
            const h = Math.max(2, Math.round((t.count / maxTrend) * 100));
            return (
              <div
                key={t.date}
                title={`${t.date} — ${t.count} mesaj`}
                className="flex-1 bg-green-500 rounded-sm hover:bg-green-600 transition"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{data.trend[0]?.date}</span>
          <span>Bugün</span>
        </div>
      </div>

      {/* API keys + webhooks */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* API keys */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Zap size={16} /> En Aktif API Anahtarları
          </h3>
          {data.apiKeys.length === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">
              Henüz aktif anahtar yok.{" "}
              <Link
                href="/dashboard/api-keys"
                className="text-green-600 underline"
              >
                Bir tane oluştur
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.apiKeys.map((k) => (
                <li
                  key={k.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {k.name}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      {k.prefix}…
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {k.scopes.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className="text-sm font-semibold text-gray-900">
                      {k.usageCount.toLocaleString("tr-TR")}
                    </div>
                    <div className="text-[10px] text-gray-400">istek</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Webhook health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Webhook size={16} /> Webhook Sağlığı (24s)
          </h3>
          {data.webhookHealth.success24h === 0 &&
          data.webhookHealth.failed24h === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">
              Son 24 saatte webhook trafiği yok
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-green-500" />{" "}
                  Başarılı teslim
                </span>
                <strong className="text-green-700">
                  {data.webhookHealth.success24h.toLocaleString("tr-TR")}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <AlertCircle size={14} className="text-red-500" /> Başarısız
                </span>
                <strong className="text-red-700">
                  {data.webhookHealth.failed24h.toLocaleString("tr-TR")}
                </strong>
              </div>
              {data.webhookHealth.successRate24h !== null && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-700">Başarı oranı</span>
                  <strong
                    className={
                      data.webhookHealth.successRate24h > 0.95
                        ? "text-green-700"
                        : data.webhookHealth.successRate24h > 0.7
                          ? "text-amber-700"
                          : "text-red-700"
                    }
                  >
                    %{Math.round(data.webhookHealth.successRate24h * 100)}
                  </strong>
                </div>
              )}
              <Link
                href="/dashboard/webhooks"
                className="block text-center text-xs text-green-600 underline pt-2"
              >
                Detay →
              </Link>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Hesap yaşı: {data.accountAgeDays} gün · Plan değişikliği için{" "}
        <Link
          href="/dashboard/billing"
          className="text-green-600 underline"
        >
          fatura sayfası
        </Link>
        .
      </p>
    </div>
  );
}

function QuotaCard({
  icon: Icon,
  label,
  used,
  limit,
  unit,
  subtext,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  used: number;
  limit: number;
  unit: string;
  subtext?: string;
}) {
  const p = pct(used, limit);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
        <Icon size={12} /> {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {used.toLocaleString("tr-TR")}
        {unit && <span className="text-base font-medium text-gray-500"> {unit}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        / {limit.toLocaleString("tr-TR")}
        {subtext && <span className="ml-1 text-gray-400">({subtext})</span>}
      </div>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${progressTone(p)}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-gray-400 text-right">%{p}</div>
    </div>
  );
}
