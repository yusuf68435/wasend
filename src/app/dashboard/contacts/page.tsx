"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Plus, Trash2, Search, Upload, Download, Tag } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SkeletonTable } from "@/components/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string | null;
  notes: string | null;
  optedOut?: boolean;
}

interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  errors?: Array<{ row: number; message: string }>;
}

function ContactsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState(searchParams?.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Search state URL'de (refresh'te korunur)
  const updateSearchInUrl = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value) params.set("q", value);
      else params.delete("q");
      router.replace(`/dashboard/contacts${params.toString() ? "?" + params.toString() : ""}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => updateSearchInUrl(search), 300);
    return () => clearTimeout(t);
  }, [search, updateSearchInUrl]);

  async function reloadContacts() {
    const res = await fetch("/api/contacts?limit=500");
    if (res.ok) {
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : data.contacts || []);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportResult(null);

    const mode = confirm(
      "Aynı telefon numarasıyla eşleşen kayıtlar için:\n" +
        "Tamam = mevcudu güncelle\n" +
        "İptal = atla",
    )
      ? "update"
      : "skip";

    const text = await file.text();
    const res = await fetch(`/api/contacts/import?mode=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text,
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) {
      alert(data.error || "İçe aktarma hatası");
      return;
    }
    setImportResult(data);
    await reloadContacts();
  }

  useEffect(() => {
    fetch("/api/contacts?limit=500")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : data.contacts || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        tags: fd.get("tags") || null,
        notes: fd.get("notes") || null,
      }),
    });
    if (res.ok) {
      const contact = await res.json();
      setContacts((prev) => [contact, ...prev]);
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  function toggleAllFiltered() {
    const filteredIds = filtered.map((c) => c.id);
    const allSelected = filteredIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelected) filteredIds.forEach((id) => n.delete(id));
      else filteredIds.forEach((id) => n.add(id));
      return n;
    });
  }

  async function runBulkDelete() {
    setBulkBusy(true);
    const res = await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setBulkBusy(false);
    setBulkDeleteOpen(false);
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
    }
  }

  async function runBulkTag() {
    if (!bulkTagValue.trim()) return;
    setBulkBusy(true);
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], addTag: bulkTagValue.trim() }),
    });
    setBulkBusy(false);
    if (res.ok) {
      setBulkTagValue("");
      await reloadContacts();
      setSelected(new Set());
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kişiler</h2>
          <p className="text-gray-500 text-sm mt-1">{contacts.length} kişi kayıtlı</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 border border-gray-300 px-3 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload size={16} />
            {importing ? "İçe aktarılıyor..." : "CSV İçe Aktar"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          <a
            href="/api/contacts/export"
            className="flex items-center gap-2 border border-gray-300 px-3 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Dışa Aktar
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
          >
            <Plus size={18} /> Kişi Ekle
          </button>
        </div>
      </div>

      {importResult && (
        <div className="bg-blue-50 text-blue-800 border border-blue-200 p-3 rounded-lg text-sm mb-4">
          İçe aktarma tamamlandı: {importResult.inserted} eklendi,{" "}
          {importResult.updated} güncellendi, {importResult.skipped} atlandı
          (toplam {importResult.total}).
          {importResult.errors && importResult.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
              {importResult.errors.map((e, i) => (
                <li key={i}>
                  Satır {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İsim *</label>
              <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Müşteri adı" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input name="phone" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="+905551234567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
              <input name="tags" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="vip, kuafor (virgülle ayır)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
              <input name="notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Opsiyonel not" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">Kaydet</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">İptal</button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Kişi ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
          placeholder="Kişi ara..."
        />
      </div>

      {selected.size > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-amber-900">
            {selected.size} kişi seçildi
          </span>
          <div className="flex items-center gap-1">
            <input
              value={bulkTagValue}
              onChange={(e) => setBulkTagValue(e.target.value)}
              placeholder="Etiket ekle..."
              aria-label="Toplu etiket"
              className="px-2 py-1 border border-amber-300 rounded text-xs bg-white"
            />
            <button
              onClick={runBulkTag}
              disabled={!bulkTagValue.trim() || bulkBusy}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Tag size={12} /> Ekle
            </button>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-1"
          >
            <Trash2 size={12} /> Seçili Sil
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs px-3 py-1.5 text-amber-900 hover:bg-amber-100 rounded"
          >
            Temizle
          </button>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Henüz kişi eklenmedi"
          description="Müşterilerinizi manuel olarak ekleyin ya da CSV dosyasıyla toplu içe aktarın."
          actionLabel="İlk kişiyi ekle"
          onAction={() => setShowForm(true)}
          secondaryLabel="CSV'den içe aktar"
          secondaryHref="#"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          &quot;{search}&quot; için kayıt yok
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((c) => selected.has(c.id))}
                    onChange={toggleAllFiltered}
                    aria-label="Tüm filtrelenmiş kişileri seç/bırak"
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İsim</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Etiketler</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((contact) => {
                const isSelected = selected.has(contact.id);
                return (
                  <tr
                    key={contact.id}
                    className={`hover:bg-gray-50 ${isSelected ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(contact.id)}
                        aria-label={isSelected ? "Seçimi kaldır" : "Seç"}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{contact.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contact.phone}</td>
                    <td className="px-6 py-4">
                      {contact.tags?.split(",").map((tag) => (
                        <span key={tag} className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full mr-1">
                          {tag.trim()}
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        aria-label={`${contact.name} kişisini sil`}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Toplu silme"
        message={`${selected.size} kişi kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`}
        confirmLabel="Sil"
        variant="danger"
        loading={bulkBusy}
        onConfirm={runBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={5} />}>
      <ContactsContent />
    </Suspense>
  );
}
