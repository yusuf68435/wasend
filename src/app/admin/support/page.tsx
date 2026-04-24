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
  open: "bg-[#0071e3]/10 text-[#0071e3]",
  "pending-user": "bg-[#ff9f0a]/10 text-[#ff9f0a]",
  closed: "bg-[#f5f5f7] text-[#6e6e73]",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-[#f5f5f7] text-[#6e6e73]",
  normal: "bg-[#f5f5f7] text-[#1d1d1f]",
  high: "bg-[#ff453a]/10 text-[#ff453a]",
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
        <h2 className="display-md text-[#1d1d1f] inline-flex items-center gap-2">
          <LifeBuoy size={22} /> Destek Talepleri
        </h2>
        <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1">
          Kullanıcılardan gelen tüm talepler. Tıklayarak yanıtla.
        </p>
      </div>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
        >
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="pending-user">Cevap bekliyor</option>
          <option value="closed">Kapalı</option>
        </select>
      </div>

      {loading ? (
        <p className="text-[#86868b] text-[13px]">Yükleniyor...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-10 text-center">
          <LifeBuoy className="mx-auto text-[#86868b] mb-2" size={32} />
          <p className="text-[#6e6e73] text-[13px] tracking-tight">Talep yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-[#86868b] uppercase tracking-tight border-b border-[#d2d2d7]">
                <th className="px-4 py-2">Konu</th>
                <th className="px-4 py-2">Kiracı</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Öncelik</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Mesaj</th>
                <th className="px-4 py-2">Güncelleme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-[#fbfbfd]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/support/${t.id}`}
                      className="text-[13px] font-medium text-[#1d1d1f] hover:underline"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    <div className="text-[#1d1d1f]">
                      {t.user.businessName || t.user.name}
                    </div>
                    <div className="text-[11px] text-[#6e6e73]">{t.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#1d1d1f]">{t.user.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight " +
                        (PRIORITY_COLOR[t.priority] || "bg-[#f5f5f7] text-[#6e6e73]")
                      }
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight " +
                        (STATUS_COLOR[t.status] || "bg-[#f5f5f7] text-[#6e6e73]")
                      }
                    >
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1d1d1f]">
                    {t._count.messages}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#6e6e73]">
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
