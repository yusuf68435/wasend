"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Shield, Ban, Download } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  const [sort, setSort] = useState("createdAt");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState<"suspend" | "unsuspend" | null>(
    null,
  );
  const [bulkBusy, setBulkBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (plan) params.set("plan", plan);
    if (status) params.set("status", status);
    if (sort !== "createdAt") params.set("sort", sort);
    const res = await fetch(`/api/admin/tenants?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTenants(data.tenants);
    }
    setSelected(new Set());
    setLoading(false);
  }, [q, plan, status, sort]);

  function buildExportHref(): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (plan) params.set("plan", plan);
    if (status) params.set("status", status);
    return `/api/admin/tenants/export?${params.toString()}`;
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === tenants.length) setSelected(new Set());
    else setSelected(new Set(tenants.map((t) => t.id)));
  }

  async function runBulk(suspend: boolean) {
    setBulkBusy(true);
    const reason = suspend ? "Toplu admin işlemi" : null;
    const res = await fetch("/api/admin/tenants/bulk-suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], suspend, reason }),
    });
    setBulkBusy(false);
    setBulkDialogOpen(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "İşlem başarısız");
      return;
    }
    const data = await res.json();
    setMsg(
      `${data.updated} kiracı ${suspend ? "askıya alındı" : "aktifleştirildi"}${
        data.skipped > 0 ? ` (${data.skipped} atlandı)` : ""
      }`,
    );
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Kiracılar</h2>
        <p className="text-slate-500 text-sm mt-1">
          Tüm platform kullanıcıları. Detay için satıra tıklayın.
        </p>
      </div>

      {msg && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2 rounded">
          {msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="E-posta, isim, işletme veya telefon ara..."
            aria-label="Kiracı ara"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          aria-label="Plan filtresi"
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
          aria-label="Durum filtresi"
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sıralama"
          className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
        >
          <option value="createdAt">En Yeni</option>
          <option value="lastSeenAt">Son Giriş</option>
          <option value="email">E-posta A-Z</option>
        </select>
        <a
          href={buildExportHref()}
          className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm hover:bg-slate-50"
          title="Mevcut filtreleri CSV olarak indir"
        >
          <Download size={14} /> CSV
        </a>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 bg-amber-500/10 border border-amber-300 rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-sm font-medium text-amber-900">
            {selected.size} kiracı seçildi
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setBulkDialogOpen("suspend")}
            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Toplu Askıya Al
          </button>
          <button
            onClick={() => setBulkDialogOpen("unsuspend")}
            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Toplu Askıyı Kaldır
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Seçimi Temizle
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-slate-400 py-12">Yükleniyor...</p>
        ) : tenants.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Kayıt bulunamadı</p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === tenants.length && tenants.length > 0}
                    onChange={toggleAll}
                    aria-label="Tümünü seç"
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-2">Kiracı</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Kişi</th>
                <th className="px-4 py-2">Mesaj</th>
                <th className="px-4 py-2">Son Giriş</th>
                <th className="px-4 py-2">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => {
                const isSelected = selected.has(t.id);
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50 ${isSelected ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(t.id)}
                        aria-label={isSelected ? "Seçimi kaldır" : "Seç"}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tenants/${t.id}`}
                        className="text-sm text-slate-900 hover:underline flex items-center gap-2"
                      >
                        {t.isSuperAdmin && (
                          <Shield size={12} className="text-amber-500" aria-label="Super admin" />
                        )}
                        <div>
                          <div className="font-medium">{t.businessName || t.name}</div>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={bulkDialogOpen !== null}
        title={bulkDialogOpen === "suspend" ? "Toplu askıya alma" : "Toplu askıyı kaldırma"}
        message={
          bulkDialogOpen === "suspend"
            ? `${selected.size} kiracı askıya alınacak. Super adminler ve kendiniz otomatik atlanır. Devam etmek istiyor musunuz?`
            : `${selected.size} kiracının askısı kaldırılacak. Devam?`
        }
        confirmLabel={bulkDialogOpen === "suspend" ? "Askıya Al" : "Askıyı Kaldır"}
        variant={bulkDialogOpen === "suspend" ? "danger" : "default"}
        loading={bulkBusy}
        onConfirm={() => runBulk(bulkDialogOpen === "suspend")}
        onCancel={() => setBulkDialogOpen(null)}
      />
    </div>
  );
}
