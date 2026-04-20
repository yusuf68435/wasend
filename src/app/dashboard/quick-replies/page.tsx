"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";

interface QuickReply {
  id: string;
  shortcut: string;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
}

export default function QuickRepliesPage() {
  const [items, setItems] = useState<QuickReply[]>([]);
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quick-replies")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/quick-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortcut: shortcut.trim().toLowerCase(),
        content,
        mediaUrl: mediaUrl.trim() || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Kaydedilemedi");
      return;
    }
    const item = await res.json();
    setItems((p) => [item, ...p]);
    setShortcut("");
    setContent("");
    setMediaUrl("");
  }

  async function remove(id: string) {
    if (!confirm("Kısayolu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/quick-replies?id=${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <Zap size={20} className="text-orange-500" /> Hızlı Cevaplar
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Sık kullanılan cevapları kısayollarla kaydedin. API üzerinden
          entegrasyon için hazır; UI entegrasyonu yakında.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={save}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kısayol</label>
            <input
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              required
              placeholder="selam"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">küçük harf/rakam/tire</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Medya URL&apos;i (opsiyonel)</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
            placeholder="Merhaba! Nasıl yardımcı olabilirim?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Ekle
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz hızlı cevap yok</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((q) => (
              <div key={q.id} className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">
                      /{q.shortcut}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{q.content}</p>
                  {q.mediaUrl && (
                    <p className="text-xs text-gray-400 mt-1">📎 {q.mediaUrl}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(q.id)}
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
