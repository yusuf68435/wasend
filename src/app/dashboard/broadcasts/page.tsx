"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Send, Clock } from "lucide-react";

interface Broadcast {
  id: string;
  name: string;
  message: string;
  targetTags: string | null;
  segmentId: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  sentCount: number;
  failedCount: number;
  rateLimit: number;
  scheduledAt: string | null;
  status: string;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/broadcasts")
      .then((r) => r.json())
      .then(setBroadcasts)
      .finally(() => setLoading(false));
    fetch("/api/segments")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSegments);
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = {
      name: fd.get("name"),
      message: fd.get("message"),
    };

    const targetTags = (fd.get("targetTags") as string) || "";
    const segmentId = (fd.get("segmentId") as string) || "";
    const mediaType = (fd.get("mediaType") as string) || "";
    const mediaUrl = (fd.get("mediaUrl") as string) || "";
    const scheduledAt = (fd.get("scheduledAt") as string) || "";
    const rateLimit = Number(fd.get("rateLimit"));

    if (segmentId) payload.segmentId = segmentId;
    else if (targetTags.trim()) payload.targetTags = targetTags;
    if (mediaType && mediaUrl) {
      payload.mediaType = mediaType;
      payload.mediaUrl = mediaUrl;
    }
    if (scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString();
    if (rateLimit && !Number.isNaN(rateLimit)) payload.rateLimit = rateLimit;

    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Oluşturulamadı");
      return;
    }
    const broadcast = await res.json();
    setBroadcasts((prev) => [broadcast, ...prev]);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/broadcasts?id=${id}`, { method: "DELETE" });
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
  }

  async function sendNow(id: string) {
    if (!confirm("Kampanyayı şimdi göndermek istediğinize emin misiniz?")) return;
    setSendingId(id);
    setError(null);
    const res = await fetch("/api/broadcasts/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcastId: id }),
    });
    setSendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Gönderim hatası");
      return;
    }
    const fresh = await fetch("/api/broadcasts").then((r) => r.json());
    setBroadcasts(fresh);
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Taslak", color: "bg-gray-100 text-gray-600" },
    scheduled: { label: "Zamanlanmış", color: "bg-blue-50 text-blue-700" },
    sending: { label: "Gönderiliyor", color: "bg-yellow-50 text-yellow-700" },
    sent: { label: "Gönderildi", color: "bg-green-50 text-green-700" },
    failed: { label: "Başarısız", color: "bg-red-50 text-red-700" },
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

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı</label>
              <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Örn: Şubat İndirim Kampanyası" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesaj / Medya Açıklaması
              </label>
              <textarea name="message" required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Gönderilecek mesaj içeriği..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef: Segment (varsa etiketi geçersiz kılar)
                </label>
                <select
                  name="segmentId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— yok —</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef: Etiketler
                </label>
                <input
                  name="targetTags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="vip, kuafor (virgülle)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medya Türü (opsiyonel)</label>
                <select
                  name="mediaType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— yok —</option>
                  <option value="image">Görsel</option>
                  <option value="document">Belge</option>
                  <option value="video">Video</option>
                  <option value="audio">Ses</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medya URL&apos;i</label>
                <input
                  name="mediaUrl"
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zamanlanmış Gönderim (opsiyonel)
                </label>
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dakika Başı Limit
                </label>
                <input
                  name="rateLimit"
                  type="number"
                  min={1}
                  max={1000}
                  defaultValue={80}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
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
            const canSend = b.status === "draft" || b.status === "scheduled";
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{b.name}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                      {b.scheduledAt && b.status === "scheduled" && (
                        <span className="text-xs text-blue-600 inline-flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(b.scheduledAt).toLocaleString("tr-TR")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{b.message}</p>
                    {b.mediaUrl && (
                      <p className="text-xs text-gray-400 mb-1">
                        📎 {b.mediaType}: {b.mediaUrl}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {b.sentCount} gönderildi
                        {b.failedCount > 0 && ` · ${b.failedCount} başarısız`}
                      </span>
                      {b.targetTags && <span>Etiket: {b.targetTags}</span>}
                      {b.segmentId && <span>Segment ID: {b.segmentId}</span>}
                      <span>Limit: {b.rateLimit}/dk</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canSend && (
                      <button
                        onClick={() => sendNow(b.id)}
                        disabled={sendingId === b.id}
                        title="Şimdi gönder"
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500 transition p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
