"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  _count: { messages: number };
}

const STATUS_LABEL: Record<string, string> = {
  open: "Açık",
  "pending-user": "Yanıtınız bekleniyor",
  closed: "Kapalı",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  "pending-user": "bg-amber-50 text-amber-700",
  closed: "bg-gray-100 text-gray-500",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/support/tickets");
    if (res.ok) {
      const d = await res.json();
      setTickets(d.tickets);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, priority }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Oluşturulamadı");
      return;
    }
    setSubject("");
    setBody("");
    setCreating(false);
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
            <LifeBuoy size={22} /> Destek
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sorunlarınız ve özellik istekleri için buradan yazın. 1 iş günü
            içinde dönüş yaparız.
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <Plus size={16} /> Yeni Talep
        </button>
      </div>

      {err && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {err}
        </div>
      )}

      {creating && (
        <form
          onSubmit={create}
          className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold text-gray-900">Yeni Talep</h3>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Konu</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              placeholder="Kısa başlık — örn: webhook çalışmıyor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Detay</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={5}
              maxLength={5000}
              rows={5}
              placeholder="Ne denedin, ne bekliyordun, ne oldu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Öncelik</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {busy ? "Gönderiliyor..." : "Gönder"}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Yükleniyor...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <LifeBuoy className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-gray-500 text-sm">Henüz talebiniz yok</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li
              key={t.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-green-300 transition"
            >
              <Link
                href={`/dashboard/support/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-500">
                    {t._count.messages} mesaj ·{" "}
                    {new Date(t.updatedAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <span
                  className={
                    "text-xs px-2 py-0.5 rounded-full flex-shrink-0 " +
                    (STATUS_COLOR[t.status] || "bg-gray-100 text-gray-700")
                  }
                >
                  {STATUS_LABEL[t.status] || t.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
