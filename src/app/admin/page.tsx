"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
}

const PLAN_COLOR: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  PRO: "bg-blue-100 text-blue-700",
  BUSINESS: "bg-purple-100 text-purple-700",
};

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data)
    return <div className="text-slate-400">Yükleniyor...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Platform Genel Bakışı</h2>
        <p className="text-slate-500 text-sm mt-1">
          Tüm kiracıların özet verileri
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI
          icon={<Users size={18} />}
          label="Toplam Kiracı"
          value={data.tenants.total}
          sub={`+${data.tenants.new7d} bu hafta`}
          color="bg-blue-50 text-blue-700"
        />
        <KPI
          icon={<Activity size={18} />}
          label="7gün Aktif"
          value={data.tenants.active7d}
          sub={`${data.tenants.total > 0 ? Math.round((data.tenants.active7d / data.tenants.total) * 100) : 0}% retention`}
          color="bg-green-50 text-green-700"
        />
        <KPI
          icon={<DollarSign size={18} />}
          label="MRR (₺)"
          value={`₺${data.revenue.mrrTry.toLocaleString("tr-TR")}`}
          sub="plan bazlı tahmin"
          color="bg-amber-50 text-amber-700"
        />
        <KPI
          icon={<ShieldAlert size={18} />}
          label="Askıya Alınan"
          value={data.tenants.suspended}
          color="bg-red-50 text-red-700"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI
          icon={<MessageSquare size={18} />}
          label="Bugün Mesaj"
          value={data.usage.messagesToday}
          sub={`${data.usage.messagesTotal} toplam`}
          color="bg-indigo-50 text-indigo-700"
        />
        <KPI
          icon={<Users size={18} />}
          label="Toplam Kişi"
          value={data.usage.contacts}
          color="bg-cyan-50 text-cyan-700"
        />
        <KPI
          icon={<Megaphone size={18} />}
          label="Toplam Broadcast"
          value={data.usage.broadcasts}
          color="bg-orange-50 text-orange-700"
        />
        <KPI
          icon={<Zap size={18} />}
          label="Aktif Akış"
          value={data.usage.flowsActive}
          color="bg-yellow-50 text-yellow-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Plan Dağılımı
          </h3>
          {data.revenue.byPlan.length === 0 ? (
            <p className="text-sm text-slate-400">Henüz veri yok</p>
          ) : (
            <ul className="space-y-2">
              {data.revenue.byPlan.map((p) => (
                <li key={p.plan} className="flex items-center justify-between">
                  <span
                    className={
                      "text-xs px-2 py-0.5 rounded " +
                      (PLAN_COLOR[p.plan] || "bg-slate-100 text-slate-700")
                    }
                  >
                    {p.plan}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">AI Kullanımı (30g)</h3>
          <div className="text-3xl font-bold text-slate-900">
            {(data.ai.tokens30d / 1000).toFixed(1)}K
          </div>
          <p className="text-sm text-slate-500 mt-1">token</p>
          <p className="text-sm text-slate-500 mt-3">
            Toplam maliyet:{" "}
            <span className="font-medium text-slate-900">
              ${data.ai.costUsd30d.toFixed(3)}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Son Kayıtlar</h3>
          {data.recentTenants.length === 0 ? (
            <p className="text-sm text-slate-400">Kayıt yok</p>
          ) : (
            <ul className="space-y-2">
              {data.recentTenants.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="text-sm text-slate-900 hover:underline truncate flex-1"
                  >
                    {t.businessName || t.name || t.email}
                  </Link>
                  <span
                    className={
                      "text-xs px-2 py-0.5 rounded " +
                      (PLAN_COLOR[t.plan] || "bg-slate-100 text-slate-700")
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
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={"p-1.5 rounded-lg " + color}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
