"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

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
    return (
      <div className="text-[#6e6e73] p-8 text-sm tracking-tight">Yükleniyor…</div>
    );
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
    <div className="max-w-[980px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <span className="eyebrow text-[#6e6e73]">Faturalandırma</span>
        <h1 className="display-md text-[#1d1d1f] mt-2">Planın, kullanım, yükseltme.</h1>
        <p className="text-[15px] text-[#6e6e73] mt-2 max-w-[560px] tracking-tight">
          Tüm fiyatlar KDV dahil. iyzico ile güvenli ödeme, istediğin zaman iptal.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      {/* Current plan + usage */}
      <section className="bg-white rounded-3xl border border-[#d2d2d7] p-8 md:p-10 mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#f5f5f7]">
          <div>
            <p className="eyebrow text-[#6e6e73]">Mevcut plan</p>
            <p className="text-[40px] font-semibold tracking-tight text-[#1d1d1f] leading-none mt-2">
              {PLAN_LABELS[data.plan] || data.plan}
            </p>
            <p className="text-[15px] text-[#6e6e73] mt-2 tracking-tight">
              ₺{data.limits.priceTry.toLocaleString("tr-TR")} / ay · KDV dahil
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <UsageCard
            label="Kişiler"
            used={data.usage.contacts}
            limit={data.limits.contactLimit}
            pct={pctContacts}
          />
          <UsageCard
            label="Aylık toplu mesaj"
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
            label="AI token (ay)"
            used={data.usage.aiTokensThisMonth}
            limit={data.limits.aiTokensPerMonth}
            pct={pctAi}
          />
        </div>
      </section>

      {/* Plans */}
      <div className="mb-5 flex items-end justify-between">
        <h2 className="display-md text-[#1d1d1f]">Planlar</h2>
        <span className="text-sm text-[#6e6e73] tracking-tight">Yıllık abonelikte 2 ay bedava</span>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLAN_ORDER.map((plan) => {
          const limits = data.allPlans[plan];
          if (!limits) return null;
          const isCurrent = data.plan === plan;
          const isPopular = plan === "PRO";
          const annualPrice = Math.round(limits.priceTry * 10).toLocaleString("tr-TR");
          return (
            <div
              key={plan}
              className={`relative rounded-3xl p-8 flex flex-col transition ${
                isPopular
                  ? "bg-[#1d1d1f] text-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
                  : "bg-white text-[#1d1d1f] border border-[#d2d2d7] shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-[11px] font-semibold tracking-tight px-3 py-1 rounded-full">
                  En popüler
                </span>
              )}
              {isCurrent && (
                <span
                  className={`absolute top-5 right-5 text-[11px] font-semibold tracking-tight px-2.5 py-1 rounded-full ${
                    isPopular
                      ? "bg-white/15 text-white"
                      : "bg-[#1d1d1f]/5 text-[#1d1d1f]"
                  }`}
                >
                  Aktif
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-[17px] font-semibold tracking-tight">
                  {PLAN_LABELS[plan]}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[48px] font-semibold tracking-tight leading-none">
                    ₺{limits.priceTry.toLocaleString("tr-TR")}
                  </span>
                  <span
                    className={`text-[15px] ${isPopular ? "text-white/60" : "text-[#6e6e73]"}`}
                  >
                    /ay
                  </span>
                </div>
                <p
                  className={`text-[13px] mt-2 tracking-tight ${
                    isPopular ? "text-white/60" : "text-[#6e6e73]"
                  }`}
                >
                  ₺{annualPrice}/yıl · 2 ay bedava
                </p>
              </div>

              <ul
                className={`text-[14px] space-y-3 mb-8 flex-1 ${
                  isPopular ? "text-white/85" : "text-[#1d1d1f]"
                }`}
              >
                <FeatureLine
                  dark={isPopular}
                  value={`${limits.contactLimit.toLocaleString("tr-TR")} kişi`}
                />
                <FeatureLine
                  dark={isPopular}
                  value={`${limits.broadcastsPerMonth}/ay toplu mesaj`}
                />
                <FeatureLine dark={isPopular} value={`${limits.flows} akış`} />
                <FeatureLine
                  dark={isPopular}
                  value={`${(limits.aiTokensPerMonth / 1000).toLocaleString(
                    "tr-TR",
                  )}K AI token/ay`}
                />
                <FeatureLine
                  dark={isPopular}
                  value={`${limits.teamMembers} ekip üyesi`}
                />
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className={`w-full h-11 rounded-full text-[14px] font-semibold tracking-tight cursor-default ${
                    isPopular
                      ? "bg-white/10 text-white/70"
                      : "bg-[#f5f5f7] text-[#6e6e73]"
                  }`}
                >
                  Mevcut plan
                </button>
              ) : plan === "STARTER" ? (
                <button
                  disabled={changing}
                  onClick={() => changePlan(plan)}
                  className="w-full h-11 rounded-full text-[14px] font-semibold tracking-tight bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] transition disabled:opacity-50"
                >
                  {changing ? "…" : "Başlangıç'a geç"}
                </button>
              ) : (
                <button
                  disabled={changing}
                  onClick={() => payWithIyzico(plan as "PRO" | "BUSINESS")}
                  className={`w-full h-11 rounded-full text-[14px] font-semibold tracking-tight transition disabled:opacity-50 ${
                    isPopular
                      ? "bg-white text-[#1d1d1f] hover:bg-white/90"
                      : "bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]"
                  }`}
                >
                  {changing ? "…" : "iyzico ile satın al"}
                </button>
              )}
            </div>
          );
        })}
      </section>

      {/* Payment note */}
      <section className="mt-10 rounded-3xl border border-[#d2d2d7] bg-[#fbfbfd] p-6 flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center">
          <Check size={18} />
        </div>
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
            iyzico ile güvenli ödeme
          </p>
          <p className="text-[13px] text-[#6e6e73] mt-1 tracking-tight leading-relaxed">
            Tüm ödemeler KDV dahildir. Yıllık abonelikte 2 ay bedava — indirim
            fatura ekranında otomatik uygulanır. İptal tek tık; bir sonraki dönem
            başına kadar aktif kalır.
          </p>
        </div>
      </section>
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
  const color =
    pct > 90 ? "bg-[#ff453a]" : pct > 70 ? "bg-[#ff9f0a]" : "bg-[#30d158]";
  return (
    <div className="bg-[#f5f5f7] rounded-2xl p-4">
      <p className="text-[12px] text-[#6e6e73] tracking-tight">{label}</p>
      <p className="text-[22px] font-semibold tracking-tight text-[#1d1d1f] mt-1 leading-none">
        {used.toLocaleString("tr-TR")}
        <span className="text-[13px] text-[#86868b] font-normal">
          {" "}
          /{limit.toLocaleString("tr-TR")}
        </span>
      </p>
      <div className="w-full h-1 bg-[#d2d2d7] rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeatureLine({ value, dark }: { value: string; dark?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <Check
        size={14}
        className={dark ? "text-[#30d158] shrink-0" : "text-[#1d1d1f] shrink-0"}
      />
      <span className="tracking-tight">{value}</span>
    </li>
  );
}
