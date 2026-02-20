"use client";

import { useEffect, useState } from "react";
import { Bot, Plus, Trash2 } from "lucide-react";

interface AutoReply {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

export default function AutoRepliesPage() {
  const [replies, setReplies] = useState<AutoReply[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auto-replies")
      .then((r) => r.json())
      .then(setReplies)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auto-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger: fd.get("trigger"),
        response: fd.get("response"),
      }),
    });
    if (res.ok) {
      const reply = await res.json();
      setReplies((prev) => [reply, ...prev]);
      setShowForm(false);
    }
  }

  async function toggleActive(reply: AutoReply) {
    await fetch("/api/auto-replies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reply.id, isActive: !reply.isActive }),
    });
    setReplies((prev) =>
      prev.map((r) => (r.id === reply.id ? { ...r, isActive: !r.isActive } : r))
    );
  }

  async function handleDelete(id: string) {
    await fetch(`/api/auto-replies?id=${id}`, { method: "DELETE" });
    setReplies((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Otomatik Cevaplar</h2>
          <p className="text-gray-500 text-sm mt-1">Müşteri mesajlarına otomatik yanıt kuralları</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
        >
          <Plus size={18} /> Kural Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tetikleyici Kelime / Cümle
              </label>
              <input
                name="trigger"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder='Örn: "fiyat", "çalışma saatleri", "randevu"'
              />
              <p className="text-xs text-gray-400 mt-1">Müşteri bu kelimeyi yazarsa otomatik cevap gider</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Otomatik Cevap</label>
              <textarea
                name="response"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Örn: Merhaba! Fiyat listemiz için: ..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">Kaydet</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">İptal</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Yükleniyor...</p>
      ) : replies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bot size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Henüz otomatik cevap kuralı yok</p>
          <p className="text-gray-400 text-sm mt-1">Müşterilerinize 7/24 otomatik cevap verin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      Tetikleyici: &quot;{reply.trigger}&quot;
                    </span>
                    <button
                      onClick={() => toggleActive(reply)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        reply.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {reply.isActive ? "Aktif" : "Pasif"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{reply.response}</p>
                </div>
                <button onClick={() => handleDelete(reply.id)} className="text-gray-400 hover:text-red-500 transition ml-4">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
