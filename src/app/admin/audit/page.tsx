"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";

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
  "tenant.plan.change": "text-amber-700",
  "admin.promote": "text-purple-700",
  "admin.demote": "text-slate-700",
  "announcement.create": "text-blue-700",
  "announcement.delete": "text-red-700",
  "announcement.toggle": "text-slate-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("action", filter);
    fetch(`/api/admin/audit?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((d) => setLogs(d.logs));
  }, [filter]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
          <ScrollText size={22} /> Denetim Kaydı
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Tüm admin eylemlerinin değişmez kaydı (IP, aktör, hedef, detay).
        </p>
      </div>

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
        >
          <option value="">Tüm eylemler</option>
          <option value="tenant.suspend">Askıya alma</option>
          <option value="tenant.unsuspend">Askı kaldırma</option>
          <option value="tenant.plan.change">Plan değişikliği</option>
          <option value="admin.promote">Admin yetki verme</option>
          <option value="admin.demote">Admin yetki alma</option>
          <option value="announcement.create">Duyuru oluşturma</option>
          <option value="announcement.delete">Duyuru silme</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {logs.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Kayıt bulunamadı</p>
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
