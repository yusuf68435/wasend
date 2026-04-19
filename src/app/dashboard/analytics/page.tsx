"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, Users, Bot, Send } from "lucide-react";

interface Series {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  incomingCount: number;
  newContacts: number;
  optOuts: number;
}

interface Totals {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  incomingCount: number;
  newContacts: number;
  optOuts: number;
}

interface Summary {
  range: number;
  series: Series[];
  totals: Totals;
  snapshot: {
    totalContacts: number;
    activeFlows: number;
    pendingReminders: number;
  };
  ai: {
    totalTokens: number;
    totalCost: number;
  };
}

interface TriggersResp {
  triggers: Array<{ trigger: string; matches: number; active: boolean }>;
}

const RANGES = [
  { label: "7 gün", value: 7 },
  { label: "30 gün", value: 30 },
  { label: "90 gün", value: 90 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [triggers, setTriggers] = useState<TriggersResp["triggers"]>([]);

  useEffect(() => {
    fetch(`/api/analytics/summary?range=${range}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
    fetch("/api/analytics/triggers")
      .then((r) => (r.ok ? r.json() : { triggers: [] }))
      .then((d: TriggersResp) => setTriggers(d.triggers));
  }, [range]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analitik</h2>
          <p className="text-gray-500 text-sm mt-1">
            Mesaj, teslim, okuma oranları ve engagement
          </p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={
                "px-3 py-1 text-sm rounded " +
                (range === r.value
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-50")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<Send size={18} />}
          label="Gönderilen"
          value={data?.totals.sent ?? 0}
          color="text-green-600 bg-green-50"
        />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Okunma Oranı"
          value={
            data && data.totals.sent > 0
              ? `${Math.round((data.totals.read / data.totals.sent) * 100)}%`
              : "—"
          }
          color="text-blue-600 bg-blue-50"
        />
        <KpiCard
          icon={<Users size={18} />}
          label="Aktif Kişi"
          value={data?.snapshot.totalContacts ?? 0}
          color="text-purple-600 bg-purple-50"
        />
        <KpiCard
          icon={<Bot size={18} />}
          label="AI Token (7g)"
          value={
            data?.ai.totalTokens
              ? `${(data.ai.totalTokens / 1000).toFixed(1)}K`
              : "0"
          }
          extra={
            data?.ai.totalCost
              ? `$${data.ai.totalCost.toFixed(3)}`
              : undefined
          }
          color="text-orange-600 bg-orange-50"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
          <BarChart3 size={18} /> Mesaj Akışı
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#16a34a" name="Gönderilen" dot={false} />
              <Line type="monotone" dataKey="delivered" stroke="#2563eb" name="Teslim" dot={false} />
              <Line type="monotone" dataKey="read" stroke="#9333ea" name="Okundu" dot={false} />
              <Line type="monotone" dataKey="failed" stroke="#dc2626" name="Başarısız" dot={false} />
              <Line type="monotone" dataKey="incomingCount" stroke="#f59e0b" name="Gelen" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Kontak Büyümesi</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newContacts" fill="#22c55e" name="Yeni" />
                <Bar dataKey="optOuts" fill="#ef4444" name="Çıkış" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">En Çok Tetiklenen Kurallar</h3>
          {triggers.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Henüz veri yok</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {triggers.map((t, i) => (
                <li key={i} className="py-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
                    <span className="font-medium text-gray-900">{t.trigger}</span>
                    {!t.active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 rounded">pasif</span>
                    )}
                  </div>
                  <span className="text-gray-600">{t.matches} eşleşme</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Günlük metrikler saat 01:00 UTC&apos;de agrege edilir. Bugünün değerleri
        canlı hesaplanır.
      </p>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  extra,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  extra?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={"p-1.5 rounded-lg " + color}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {extra && <div className="text-xs text-gray-400 mt-1">{extra}</div>}
    </div>
  );
}
