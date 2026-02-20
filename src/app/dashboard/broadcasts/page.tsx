"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";

interface Broadcast {
  id: string;
  name: string;
  message: string;
  targetTags: string | null;
  sentCount: number;
  status: string;
  createdAt: string;
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/broadcasts")
      .then((r) => r.json())
      .then(setBroadcasts)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        message: fd.get("message"),
        targetTags: fd.get("targetTags") || null,
      }),
    });
    if (res.ok) {
      const broadcast = await res.json();
      setBroadcasts((prev) => [broadcast, ...prev]);
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/broadcasts?id=${id}`, { method: "DELETE" });
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Taslak", color: "bg-gray-100 text-gray-600" },
    sending: { label: "Gönderiliyor", color: "bg-yellow-50 text-yellow-700" },
    sent: { label: "Gönderildi", color: "bg-green-50 text-green-700" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Toplu Mesajlar</h2>
          <p className="text-gray-500 text-sm mt-1">Kampanya ve duyuru mesajları</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
        >
          <Plus size={18} /> Yeni Kampanya
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı</label>
              <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Örn: Şubat İndirim Kampanyası" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
              <textarea name="message" required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Gönderilecek mesaj içeriği..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Etiketler (opsiyonel)</label>
              <input name="targetTags" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Boş bırakırsan herkese gider. Örn: vip, kuafor" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">Oluştur</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">İptal</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Yükleniyor...</p>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Henüz toplu mesaj yok</p>
          <p className="text-gray-400 text-sm mt-1">Tüm müşterilerinize tek seferde mesaj gönderin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => {
            const st = statusLabels[b.status] || statusLabels.draft;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{b.name}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{b.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{b.sentCount} kişiye gönderildi</span>
                      {b.targetTags && <span>Hedef: {b.targetTags}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
