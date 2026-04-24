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

const PLAN_BADGE: Record<string, string> = {
  STARTER: "bg-[#f5f5f7] text-[#6e6e73]",
  PRO: "bg-[#0071e3]/10 text-[#0071e3]",
  BUSINESS: "bg-[#1d1d1f] text-white",
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
        <h2 className="display-md text-[#1d1d1f]">Kiracılar</h2>
        <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1">
          Tüm platform kullanıcıları. Detay için satıra tıklayın.
        </p>
      </div>

      {msg && (
        <div className="mb-4 bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 text-[#ff9f0a] rounded-2xl px-4 py-3 text-[13px] tracking-tight">
          {msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="E-posta, isim, işletme veya telefon ara..."
            aria-label="Kiracı ara"
            className="w-full h-10 pl-9 pr-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          aria-label="Plan filtresi"
          className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
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
          className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
        >
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sıralama"
          className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
        >
          <option value="createdAt">En Yeni</option>
          <option value="lastSeenAt">Son Giriş</option>
          <option value="email">E-posta A-Z</option>
        </select>
        <a
          href={buildExportHref()}
          className="inline-flex items-center gap-2 border border-[#d2d2d7] text-[#1d1d1f] px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-[#f5f5f7] transition"
          title="Mevcut filtreleri CSV olarak indir"
        >
          <Download size={14} /> CSV
        </a>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-[13px] font-medium tracking-tight">
            {selected.size} kiracı seçildi
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setBulkDialogOpen("suspend")}
            className="bg-[#ff453a] text-white px-4 h-8 rounded-full text-[12px] font-medium tracking-tight hover:opacity-90 transition"
          >
            Toplu Askıya Al
          </button>
          <button
            onClick={() => setBulkDialogOpen("unsuspend")}
            className="bg-[#1d1d1f] text-white px-4 h-8 rounded-full text-[12px] font-medium tracking-tight hover:bg-black transition"
          >
            Toplu Askıyı Kaldır
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[12px] px-3 h-8 text-[#6e6e73] hover:bg-white rounded-full transition"
          >
            Seçimi Temizle
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden">
        {loading ? (
          <p className="text-center text-[#86868b] text-[13px] py-12">Yükleniyor...</p>
        ) : tenants.length === 0 ? (
          <p className="text-center text-[#86868b] text-[13px] py-12">Kayıt bulunamadı</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-[#86868b] uppercase tracking-tight border-b border-[#d2d2d7]">
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === tenants.length && tenants.length > 0}
                    onChange={toggleAll}
                    aria-label="Tümünü seç"
                    className="h-4 w-4 rounded-[6px] border-[#d2d2d7] text-[#1d1d1f] focus:ring-[#1d1d1f]/20"
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
            <tbody className="divide-y divide-[#f5f5f7]">
              {tenants.map((t) => {
                const isSelected = selected.has(t.id);
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-[#fbfbfd] ${isSelected ? "bg-[#f5f5f7]" : ""}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(t.id)}
                        aria-label={isSelected ? "Seçimi kaldır" : "Seç"}
                        className="h-4 w-4 rounded-[6px] border-[#d2d2d7] text-[#1d1d1f] focus:ring-[#1d1d1f]/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tenants/${t.id}`}
                        className="text-[13px] text-[#1d1d1f] hover:underline flex items-center gap-2"
                      >
                        {t.isSuperAdmin && (
                          <Shield size={12} className="text-[#0071e3]" aria-label="Super admin" />
                        )}
                        <div>
                          <div className="font-medium">{t.businessName || t.name}</div>
                          <div className="text-[11px] text-[#6e6e73]">{t.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight " +
                          (PLAN_BADGE[t.plan] || "bg-[#f5f5f7] text-[#6e6e73]")
                        }
                      >
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#1d1d1f]">
                      {t._count.contacts}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#1d1d1f]">
                      {t._count.messages}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#6e6e73]">
                      {t.lastSeenAt
                        ? new Date(t.lastSeenAt).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {t.suspended ? (
                        <span className="text-[11px] bg-[#ff453a]/10 text-[#ff453a] px-2 py-0.5 rounded-full font-medium tracking-tight inline-flex items-center gap-1">
                          <Ban size={10} /> Askıda
                        </span>
                      ) : (
                        <span className="text-[11px] bg-[#30d158]/10 text-[#1d7a3a] px-2 py-0.5 rounded-full font-medium tracking-tight">
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
