"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Megaphone,
  Zap,
  ShieldAlert,
  DollarSign,
  Activity,
} from "lucide-react";

/**
 * recharts bundle'ı (~150KB) admin route'unu şişiriyordu — ssr:false ile
 * server-side rendering'de bundle'dan çıkar, client'ta lazy yükle. Admin
 * FCP'sine ölçülebilir iyileşme. ResponsiveContainer'ın children render'ı
 * client-only olduğu için SSR drop zaten kabul edilebilir.
 */
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), {
  ssr: false,
});

interface Overview {
  tenants: {
    total: number;
    active7d: number;
    new7d: number;
    suspended: number;
  };
  usage: {
    contacts: number;
    messagesTotal: number;
    messagesToday: number;
    broadcasts: number;
    flowsActive: number;
  };
  revenue: {
    mrrTry: number;
    byPlan: Array<{ plan: string; count: number }>;
  };
  ai: {
    tokens30d: number;
    costUsd30d: number;
  };
  recentTenants: Array<{
    id: string;
    email: string;
    name: string;
    businessName: string | null;
    plan: string;
    createdAt: string;
  }>;
  dailySignups: Array<{ date: string; count: number }>;
  dailyMessages: Array<{ date: string; count: number }>;
  topTenants: Array<{
    id: string;
    email: string;
    name: string;
    businessName: string | null;
    plan: string;
    messages7d: number;
  }>;
}

// Plan rozetleri: Apple nötr + tek mavi ton. Renk hiyerarşisi düşük.
const PLAN_BADGE: Record<string, string> = {
  STARTER: "bg-[#f5f5f7] text-[#6e6e73]",
  PRO: "bg-[#0071e3]/10 text-[#0071e3]",
  BUSINESS: "bg-[#1d1d1f] text-white",
};

const PLAN_CHART_COLOR: Record<string, string> = {
  STARTER: "#d2d2d7",
  PRO: "#0071e3",
  BUSINESS: "#1d1d1f",
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data)
    return (
      <div className="text-[13px] text-[#86868b] tracking-tight">
        Yükleniyor…
      </div>
    );

  const retention =
    data.tenants.total > 0
      ? Math.round((data.tenants.active7d / data.tenants.total) * 100)
      : 0;

  const signupChartData = data.dailySignups.map((d) => ({
    date: formatShortDate(d.date),
    count: d.count,
  }));
  const messageChartData = data.dailyMessages.map((d) => ({
    date: formatShortDate(d.date),
    count: d.count,
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="display-md text-[#1d1d1f]">Platform Genel Bakışı</h2>
        <p className="text-[13px] text-[#6e6e73] mt-1 tracking-tight">
          Tüm kiracıların özet verileri (son 30 gün)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KPI
          icon={<Users size={18} />}
          label="Toplam Kiracı"
          value={data.tenants.total}
          sub={`+${data.tenants.new7d} bu hafta`}
        />
        <KPI
          icon={<Activity size={18} />}
          label="7g Aktif"
          value={data.tenants.active7d}
          sub={`${retention}% retention`}
        />
        <KPI
          icon={<DollarSign size={18} />}
          label="MRR"
          value={`₺${data.revenue.mrrTry.toLocaleString("tr-TR")}`}
          sub="plan bazlı tahmin"
        />
        <KPI
          icon={<ShieldAlert size={18} />}
          label="Askıda"
          value={data.tenants.suspended}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI
          icon={<MessageSquare size={18} />}
          label="Bugün Mesaj"
          value={data.usage.messagesToday}
          sub={`${data.usage.messagesTotal.toLocaleString("tr-TR")} toplam`}
        />
        <KPI
          icon={<Users size={18} />}
          label="Toplam Kişi"
          value={data.usage.contacts}
        />
        <KPI
          icon={<Megaphone size={18} />}
          label="Toplam Broadcast"
          value={data.usage.broadcasts}
        />
        <KPI
          icon={<Zap size={18} />}
          label="Aktif Akış"
          value={data.usage.flowsActive}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Günlük Kayıtlar (30g)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={signupChartData}>
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "#86868b" }} />
              <YAxis
                allowDecimals={false}
                fontSize={11}
                tick={{ fill: "#86868b" }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1d1d1f"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3 flex items-center gap-2">
            <MessageSquare size={16} /> Günlük Mesaj Hacmi (30g)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={messageChartData}>
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "#86868b" }} />
              <YAxis
                allowDecimals={false}
                fontSize={11}
                tick={{ fill: "#86868b" }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0071e3"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
            Plan Dağılımı
          </h3>
          {data.revenue.byPlan.length === 0 ? (
            <p className="text-[13px] text-[#86868b] tracking-tight">
              Henüz veri yok
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.revenue.byPlan}
                  dataKey="count"
                  nameKey="plan"
                  outerRadius={70}
                  label
                >
                  {data.revenue.byPlan.map((entry) => (
                    <Cell
                      key={entry.plan}
                      fill={PLAN_CHART_COLOR[entry.plan] || "#d2d2d7"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
            AI Kullanımı (30g)
          </h3>
          <div className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
            {(data.ai.tokens30d / 1000).toFixed(1)}K
          </div>
          <p className="text-[12px] text-[#86868b] mt-1 tracking-tight">
            token
          </p>
          <p className="text-[13px] text-[#6e6e73] mt-4 tracking-tight">
            Toplam maliyet:{" "}
            <span className="font-medium text-[#1d1d1f]">
              ${data.ai.costUsd30d.toFixed(3)}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
            Son Kayıtlar
          </h3>
          {data.recentTenants.length === 0 ? (
            <p className="text-[13px] text-[#86868b] tracking-tight">
              Kayıt yok
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentTenants.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2"
                >
                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="text-[13px] text-[#1d1d1f] hover:underline underline-offset-4 truncate flex-1 tracking-tight"
                  >
                    {t.businessName || t.name || t.email}
                  </Link>
                  <span
                    className={
                      "text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight " +
                      (PLAN_BADGE[t.plan] || "bg-[#f5f5f7] text-[#6e6e73]")
                    }
                  >
                    {t.plan}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5 mb-6">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">
          En Aktif 10 Kiracı (son 7 gün)
        </h3>
        {data.topTenants.length === 0 ? (
          <p className="text-[13px] text-[#86868b] tracking-tight">
            Henüz aktivite yok
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-[#86868b] border-b border-[#f5f5f7] tracking-tight uppercase">
                <th className="text-left py-2 font-medium">#</th>
                <th className="text-left py-2 font-medium">Kiracı</th>
                <th className="text-left py-2 font-medium">Plan</th>
                <th className="text-right py-2 font-medium">Mesaj (7g)</th>
              </tr>
            </thead>
            <tbody>
              {data.topTenants.map((t, idx) => (
                <tr
                  key={t.id}
                  className="text-[13px] border-b border-[#f5f5f7] tracking-tight"
                >
                  <td className="py-2.5 text-[#86868b] font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="text-[#1d1d1f] font-medium hover:underline underline-offset-4"
                    >
                      {t.businessName || t.name || t.email}
                    </Link>
                    <span className="text-[11px] text-[#86868b] ml-2">
                      {t.email}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={
                        "text-[11px] px-2 py-0.5 rounded-full font-medium " +
                        (PLAN_BADGE[t.plan] || "bg-[#f5f5f7] text-[#6e6e73]")
                      }
                    >
                      {t.plan}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-medium text-[#1d1d1f]">
                    {t.messages7d.toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#d2d2d7] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-[#6e6e73] tracking-tight">
          {label}
        </span>
        <span className="p-1.5 rounded-lg bg-[#f5f5f7] text-[#1d1d1f]">
          {icon}
        </span>
      </div>
      <div className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-[#86868b] mt-1 tracking-tight">
          {sub}
        </div>
      )}
    </div>
  );
}
