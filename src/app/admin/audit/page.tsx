"use client";

import { useEffect, useState } from "react";
import { ScrollText, Filter as FilterIcon, X } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ip: string | null;
  createdAt: string;
  actor: { email: string; name: string };
}

const ACTION_COLOR: Record<string, string> = {
  "tenant.suspend": "text-[#ff453a]",
  "tenant.unsuspend": "text-[#1d7a3a]",
  "tenant.bulk.suspend": "text-[#ff453a]",
  "tenant.bulk.unsuspend": "text-[#1d7a3a]",
  "tenant.plan.change": "text-[#ff9f0a]",
  "admin.promote": "text-[#0071e3]",
  "admin.demote": "text-[#6e6e73]",
  "announcement.create": "text-[#0071e3]",
  "announcement.delete": "text-[#ff453a]",
  "announcement.toggle": "text-[#6e6e73]",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [targetId, setTargetId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (actor) params.set("actor", actor);
      if (targetId) params.set("targetId", targetId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      setLoading(true);
      fetch(`/api/admin/audit?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : { logs: [] }))
        .then((d) => setLogs(d.logs))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [action, actor, targetId, dateFrom, dateTo]);

  const hasFilter = action || actor || targetId || dateFrom || dateTo;

  function clearAll() {
    setAction("");
    setActor("");
    setTargetId("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="display-md text-[#1d1d1f] inline-flex items-center gap-2">
          <ScrollText size={22} /> Denetim Kaydı
        </h2>
        <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1">
          Tüm admin eylemlerinin değişmez kaydı (aktör, hedef, IP, zaman).
        </p>
      </div>

      <div className="bg-white border border-[#d2d2d7] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FilterIcon size={16} className="text-[#86868b]" />
          <span className="text-[13px] font-medium text-[#1d1d1f] tracking-tight">Filtreler</span>
          {hasFilter && (
            <button
              onClick={clearAll}
              className="ml-auto text-[11px] text-[#6e6e73] hover:text-[#1d1d1f] inline-flex items-center gap-1 tracking-tight"
            >
              <X size={12} /> Temizle
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            aria-label="Eylem filtresi"
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[13px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          >
            <option value="">Tüm eylemler</option>
            <option value="tenant.suspend">Askıya alma</option>
            <option value="tenant.unsuspend">Askı kaldırma</option>
            <option value="tenant.bulk.suspend">Toplu askıya alma</option>
            <option value="tenant.plan.change">Plan değişikliği</option>
            <option value="admin.promote">Admin yetki verme</option>
            <option value="admin.demote">Admin yetki alma</option>
            <option value="announcement.create">Duyuru oluşturma</option>
            <option value="announcement.delete">Duyuru silme</option>
          </select>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Aktör (e-posta içerir)"
            aria-label="Aktör email filtresi"
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          />
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Hedef ID (tam)"
            aria-label="Hedef ID filtresi"
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition font-mono"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Başlangıç tarihi"
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[13px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Bitiş tarihi"
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[13px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden">
        {loading ? (
          <p className="text-center text-[#86868b] text-[13px] py-12">Yükleniyor...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-[#86868b] text-[13px] py-12">
            {hasFilter ? "Filtreye uygun kayıt yok" : "Henüz admin eylemi yok"}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-[#86868b] uppercase tracking-tight border-b border-[#d2d2d7]">
                <th className="px-4 py-2">Zaman</th>
                <th className="px-4 py-2">Aktör</th>
                <th className="px-4 py-2">Eylem</th>
                <th className="px-4 py-2">Hedef</th>
                <th className="px-4 py-2">Detay</th>
                <th className="px-4 py-2">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-[#fbfbfd]">
                  <td className="px-4 py-2 text-[11px] text-[#6e6e73] whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-[#1d1d1f]">
                    {l.actor.email}
                  </td>
                  <td
                    className={
                      "px-4 py-2 text-[11px] font-mono " +
                      (ACTION_COLOR[l.action] || "text-[#1d1d1f]")
                    }
                  >
                    {l.action}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-[#6e6e73]">
                    {l.targetType}
                    {l.targetId ? ` (${l.targetId.slice(0, 8)}…)` : ""}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-[#6e6e73] max-w-xs truncate">
                    {l.details || "—"}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-[#6e6e73] font-mono">
                    {l.ip || "—"}
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
