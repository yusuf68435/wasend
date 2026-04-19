"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Send, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  bodyText: string;
  variables: string | null;
  status: string;
  metaId: string | null;
  rejection: string | null;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("tr");
  const [category, setCategory] = useState("UTILITY");
  const [bodyText, setBodyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
  }

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates);
  }, []);

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, language, category, bodyText }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Oluşturulamadı");
      return;
    }
    setName("");
    setBodyText("");
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Şablonu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function submit(id: string) {
    setInfo(null);
    setError(null);
    const res = await fetch("/api/templates/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gönderim hatası");
      return;
    }
    setInfo("Şablon Meta'ya gönderildi. Onay için birkaç saat sürebilir.");
    await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Şablonlar</h2>
          <p className="text-gray-500 text-sm mt-1">
            Onaylı WhatsApp mesaj şablonları. Marketing mesajları için Meta onayı
            zorunludur.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Yeni Şablon
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      {info && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-4">
          {info}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createTemplate}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="welcome_message"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                küçük harf, rakam, alt çizgi
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="UTILITY">UTILITY (bildirim)</option>
                <option value="MARKETING">MARKETING (pazarlama)</option>
                <option value="AUTHENTICATION">AUTHENTICATION (OTP)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gövde Metni</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              required
              rows={4}
              placeholder="Merhaba {{1}}, randevunuz {{2}} tarihine onaylandı."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Değişkenler için Meta sözdizimi: {"{{1}}, {{2}}"}.
            </p>
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
          >
            Kaydet
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {templates.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz şablon yok</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map((t) => (
              <div key={t.id} className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{t.name}</span>
                    <span className="text-xs text-gray-400">
                      ({t.language} / {t.category})
                    </span>
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 " +
                        (STATUS_STYLE[t.status] || "bg-gray-100 text-gray-700")
                      }
                    >
                      {t.status === "APPROVED" && <CheckCircle2 size={12} />}
                      {t.status === "REJECTED" && <XCircle size={12} />}
                      {t.status === "PENDING" && <Clock size={12} />}
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {t.bodyText}
                  </p>
                  {t.rejection && (
                    <p className="text-xs text-red-600 mt-1">
                      Red sebebi: {t.rejection}
                    </p>
                  )}
                </div>
                {!t.metaId && (
                  <button
                    onClick={() => submit(t.id)}
                    title="Meta'ya onay için gönder"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Send size={16} />
                  </button>
                )}
                <button
                  onClick={() => remove(t.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
