"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Shield, Ban } from "lucide-react";

interface Tenant {
  id: string;
  email: string;
  name: string;
  businessName: string | null;
  plan: string;
  isSuperAdmin: boolean;
  suspended: boolean;
  suspendedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  _count: {
    contacts: number;
    messages: number;
    broadcasts: number;
    flows: number;
  };
}

const PLAN_COLOR: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  PRO: "bg-blue-100 text-blue-700",
  BUSINESS: "bg-purple-100 text-purple-700",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (plan) params.set("plan", plan);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/tenants?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTenants(data.tenants);
    }
    setLoading(false);
  }, [q, plan, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Kiracılar</h2>
        <p className="text-slate-500 text-sm mt-1">
          Tüm platform kullanıcıları. Detay için satıra tıklayın.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="E-posta, isim veya işletme ara..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
        >
          <option value="">Tüm planlar</option>
          <option value="STARTER">STARTER</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-slate-400 py-12">Yükleniyor...</p>
        ) : tenants.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Kayıt bulunamadı</p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-2">Kiracı</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Kişi</th>
                <th className="px-4 py-2">Mesaj</th>
                <th className="px-4 py-2">Son Giriş</th>
                <th className="px-4 py-2">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="text-sm text-slate-900 hover:underline flex items-center gap-2"
                    >
                      {t.isSuperAdmin && (
                        <Shield size={12} className="text-amber-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {t.businessName || t.name}
                        </div>
                        <div className="text-xs text-slate-500">{t.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded " +
                        (PLAN_COLOR[t.plan] || "bg-slate-100 text-slate-700")
                      }
                    >
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {t._count.contacts}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {t._count.messages}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {t.lastSeenAt
                      ? new Date(t.lastSeenAt).toLocaleDateString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {t.suspended ? (
                      <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Ban size={10} /> Askıda
                      </span>
                    ) : (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        Aktif
                      </span>
                    )}
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
