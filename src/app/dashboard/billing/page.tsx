"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check } from "lucide-react";

interface Limits {
  contactLimit: number;
  broadcastsPerMonth: number;
  aiTokensPerMonth: number;
  flows: number;
  teamMembers: number;
  priceTry: number;
}

interface Billing {
  plan: string;
  limits: Limits;
  usage: {
    contacts: number;
    broadcastsThisMonth: number;
    flows: number;
    aiTokensThisMonth: number;
  };
  allPlans: Record<string, Limits>;
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Başlangıç",
  PRO: "Profesyonel",
  BUSINESS: "İşletme",
};

const PLAN_ORDER = ["STARTER", "PRO", "BUSINESS"];

export default function BillingPage() {
  const [data, setData] = useState<Billing | null>(null);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/billing/plan");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    fetch("/api/billing/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  async function changePlan(plan: string) {
    if (!confirm(`Planı ${PLAN_LABELS[plan]} olarak güncellemek istediğinize emin misiniz?`))
      return;
    setChanging(true);
    setError(null);
    const res = await fetch("/api/billing/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setChanging(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Güncellenemedi");
      return;
    }
    await load();
  }

  async function payWithIyzico(plan: "PRO" | "BUSINESS") {
    setChanging(true);
    setError(null);
    const res = await fetch("/api/billing/iyzico/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      setChanging(false);
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Ödeme başlatılamadı");
      return;
    }
    const { paymentPageUrl } = await res.json();
    window.location.assign(paymentPageUrl);
  }

  if (!data) {
    return <div className="text-gray-400 p-8">Yükleniyor...</div>;
  }

  const pctContacts = Math.min(
    100,
    Math.round((data.usage.contacts / data.limits.contactLimit) * 100),
  );
  const pctBroadcasts = Math.min(
    100,
    Math.round((data.usage.broadcastsThisMonth / data.limits.broadcastsPerMonth) * 100),
  );
  const pctFlows = Math.min(
    100,
    Math.round((data.usage.flows / data.limits.flows) * 100),
  );
  const pctAi = Math.min(
    100,
    Math.round((data.usage.aiTokensThisMonth / data.limits.aiTokensPerMonth) * 100),
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <CreditCard size={20} /> Faturalandırma
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Mevcut plan, kullanım özeti ve yükseltme seçenekleri. Tüm fiyatlar KDV
          dahil · iyzico ile güvenli ödeme.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Mevcut Plan</p>
            <p className="text-2xl font-bold text-gray-900">
              {PLAN_LABELS[data.plan] || data.plan}
            </p>
            <p className="text-sm text-gray-500">
              ₺{data.limits.priceTry}/ay
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <UsageCard
            label="Kişiler"
            used={data.usage.contacts}
            limit={data.limits.contactLimit}
            pct={pctContacts}
          />
          <UsageCard
            label="Aylık Toplu Mesaj"
            used={data.usage.broadcastsThisMonth}
            limit={data.limits.broadcastsPerMonth}
            pct={pctBroadcasts}
          />
          <UsageCard
            label="Akışlar"
            used={data.usage.flows}
            limit={data.limits.flows}
            pct={pctFlows}
          />
          <UsageCard
            label="AI Token (ay)"
            used={data.usage.aiTokensThisMonth}
            limit={data.limits.aiTokensPerMonth}
            pct={pctAi}
          />
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-4">Planlar</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_ORDER.map((plan) => {
          const limits = data.allPlans[plan];
          if (!limits) return null;
          const isCurrent = data.plan === plan;
          const isPopular = plan === "PRO";
          const annualPrice = Math.round(limits.priceTry * 10).toLocaleString("tr-TR");
          return (
            <div
              key={plan}
              className={
                "relative bg-white rounded-xl border p-6 transition " +
                (isCurrent
                  ? "border-green-500 ring-2 ring-green-100 shadow-sm"
                  : isPopular
                    ? "border-green-300 shadow-sm"
                    : "border-gray-200")
              }
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  En popüler
                </span>
              )}
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900">
                  {PLAN_LABELS[plan]}
                </h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₺{limits.priceTry.toLocaleString("tr-TR")}
                  <span className="text-sm font-normal text-gray-500">/ay</span>
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    %17 yıllık indirim
                  </span>
                  <span className="text-xs text-gray-500">₺{annualPrice}/yıl</span>
                </div>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <FeatureLine value={`${limits.contactLimit.toLocaleString("tr-TR")} kişi`} />
                <FeatureLine value={`${limits.broadcastsPerMonth}/ay toplu mesaj`} />
                <FeatureLine value={`${limits.flows} akış`} />
                <FeatureLine
                  value={`${(limits.aiTokensPerMonth / 1000).toLocaleString(
                    "tr-TR",
                  )}K AI token/ay`}
                />
                <FeatureLine value={`${limits.teamMembers} ekip üyesi`} />
              </ul>
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-default"
                >
                  Mevcut Plan
                </button>
              ) : plan === "STARTER" ? (
                <button
                  disabled={changing}
                  onClick={() => changePlan(plan)}
                  className="w-full py-2 rounded-lg font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {changing ? "..." : "Downgrade"}
                </button>
              ) : (
                <button
                  disabled={changing}
                  onClick={() => payWithIyzico(plan as "PRO" | "BUSINESS")}
                  className="w-full py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {changing ? "..." : `iyzico ile Satın Al`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6 flex gap-3">
        <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-green-900">
          <strong>iyzico ile güvenli ödeme:</strong> Tüm ödemeler KDV dahildir.
          Yıllık abonelikte <strong>2 ay bedava</strong> (otomatik indirim
          fatura ekranında uygulanır). İptal için tek tık yeterli — bir sonraki
          dönem başına kadar aktif kalır.
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
  pct,
}: {
  label: string;
  used: number;
  limit: number;
  pct: number;
}) {
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">
        {used.toLocaleString("tr-TR")}
        <span className="text-sm text-gray-400 font-normal">
          /{limit.toLocaleString("tr-TR")}
        </span>
      </p>
      <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
        <div className={"h-full " + color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FeatureLine({ value }: { value: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check size={14} className="text-green-600 flex-shrink-0" />
      <span>{value}</span>
    </li>
  );
}
