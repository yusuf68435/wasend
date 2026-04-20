"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    businessName: string | null;
    plan: string;
  };
  _count: { messages: number };
}

const STATUS_LABEL: Record<string, string> = {
  open: "Açık",
  "pending-user": "Cevap bekliyor",
  closed: "Kapalı",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  "pending-user": "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-slate-100 text-slate-700",
  high: "bg-red-100 text-red-700",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/support?${params.toString()}`);
    if (res.ok) {
      const d = await res.json();
      setTickets(d.tickets);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
          <LifeBuoy size={22} /> Destek Talepleri
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Kullanıcılardan gelen tüm talepler. Tıklayarak yanıtla.
        </p>
      </div>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
        >
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="pending-user">Cevap bekliyor</option>
          <option value="closed">Kapalı</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400">Yükleniyor...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <LifeBuoy className="mx-auto text-slate-300 mb-2" size={32} />
          <p className="text-slate-500 text-sm">Talep yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-2">Konu</th>
                <th className="px-4 py-2">Kiracı</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Öncelik</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Mesaj</th>
                <th className="px-4 py-2">Güncelleme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/support/${t.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-slate-900">
                      {t.user.businessName || t.user.name}
                    </div>
                    <div className="text-xs text-slate-500">{t.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{t.user.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded " +
                        (PRIORITY_COLOR[t.priority] || "bg-gray-100 text-gray-700")
                      }
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded border " +
                        (STATUS_COLOR[t.status] || "bg-gray-100 text-gray-700")
                      }
                    >
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {t._count.messages}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(t.updatedAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
