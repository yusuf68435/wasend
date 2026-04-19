"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, AlertTriangle } from "lucide-react";

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
          Mevcut plan ve kullanım özeti. Stripe entegrasyonu bekleniyor — şimdilik
          dev modunda manuel olarak değiştirilebilir.
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
          return (
            <div
              key={plan}
              className={
                "bg-white rounded-xl border p-6 " +
                (isCurrent ? "border-green-500 ring-2 ring-green-100" : "border-gray-200")
              }
            >
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900">
                  {PLAN_LABELS[plan]}
                </h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₺{limits.priceTry}
                  <span className="text-sm font-normal text-gray-500">/ay</span>
                </p>
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
              <button
                disabled={isCurrent || changing}
                onClick={() => changePlan(plan)}
                className={
                  "w-full py-2 rounded-lg font-medium transition " +
                  (isCurrent
                    ? "bg-gray-100 text-gray-500 cursor-default"
                    : "bg-green-600 text-white hover:bg-green-700")
                }
              >
                {isCurrent ? "Mevcut Plan" : changing ? "..." : `${PLAN_LABELS[plan]}'a Geç`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 flex gap-3">
        <AlertTriangle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Stripe iskeleti:</strong> Gerçek ödeme akışı için{" "}
          <code className="bg-blue-100 px-1 rounded">STRIPE_ENABLED=true</code>{" "}
          env ayarlayın, ardından bu sayfa Stripe müşteri portalına yönlendirilecek
          şekilde güncellenmelidir. Şu an plan değişiklikleri doğrudan veritabanında
          yapılır.
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
