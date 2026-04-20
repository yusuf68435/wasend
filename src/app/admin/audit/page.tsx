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
  "tenant.suspend": "text-red-700",
  "tenant.unsuspend": "text-green-700",
  "tenant.bulk.suspend": "text-red-700",
  "tenant.bulk.unsuspend": "text-green-700",
  "tenant.plan.change": "text-amber-700",
  "admin.promote": "text-purple-700",
  "admin.demote": "text-slate-700",
  "announcement.create": "text-blue-700",
  "announcement.delete": "text-red-700",
  "announcement.toggle": "text-slate-700",
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
        <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
          <ScrollText size={22} /> Denetim Kaydı
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Tüm admin eylemlerinin değişmez kaydı (aktör, hedef, IP, zaman).
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FilterIcon size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filtreler</span>
          {hasFilter && (
            <button
              onClick={clearAll}
              className="ml-auto text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
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
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm"
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
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Hedef ID (tam)"
            aria-label="Hedef ID filtresi"
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Başlangıç tarihi"
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Bitiş tarihi"
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-slate-400 py-12">Yükleniyor...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-slate-400 py-12">
            {hasFilter ? "Filtreye uygun kayıt yok" : "Henüz admin eylemi yok"}
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-2">Zaman</th>
                <th className="px-4 py-2">Aktör</th>
                <th className="px-4 py-2">Eylem</th>
                <th className="px-4 py-2">Hedef</th>
                <th className="px-4 py-2">Detay</th>
                <th className="px-4 py-2">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="text-sm">
                  <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-2 text-slate-700 text-xs">
                    {l.actor.email}
                  </td>
                  <td
                    className={
                      "px-4 py-2 text-xs font-mono " +
                      (ACTION_COLOR[l.action] || "text-slate-700")
                    }
                  >
                    {l.action}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {l.targetType}
                    {l.targetId ? ` (${l.targetId.slice(0, 8)}…)` : ""}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 max-w-xs truncate">
                    {l.details || "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 font-mono">
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
