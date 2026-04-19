"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Search, Upload, Download } from "lucide-react";

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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  async function reloadContacts() {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
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
    fetch("/api/contacts")
      .then((r) => r.json())
      .then(setContacts)
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
  }

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

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
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
          placeholder="Kişi ara..."
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Henüz kişi eklenmemiş</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İsim</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Etiketler</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
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
                    <button onClick={() => handleDelete(contact.id)} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
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
