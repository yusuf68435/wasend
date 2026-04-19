"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Webhook, Power, Copy, Check } from "lucide-react";

interface OutgoingWebhook {
  id: string;
  name: string;
  url: string;
  events: string;
  isActive: boolean;
  createdAt: string;
  secret?: string;
}

const AVAILABLE_EVENTS = [
  "message.received",
  "message.sent",
  "message.delivered",
  "message.read",
  "message.failed",
  "contact.created",
  "contact.opted_out",
  "broadcast.completed",
  "flow.handoff",
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<OutgoingWebhook[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "message.received",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [lastSecret, setLastSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/webhooks-out")
      .then((r) => (r.ok ? r.json() : []))
      .then(setHooks);
  }, []);

  function toggleEvent(ev: string) {
    setSelectedEvents((cur) =>
      cur.includes(ev) ? cur.filter((e) => e !== ev) : [...cur, ev],
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLastSecret(null);
    if (selectedEvents.length === 0) {
      setError("En az bir event seçilmeli");
      return;
    }
    const res = await fetch("/api/webhooks-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url,
        events: selectedEvents.join(","),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Oluşturulamadı");
      return;
    }
    const h = await res.json();
    setLastSecret(h.secret);
    setHooks((p) => [h, ...p]);
    setName("");
    setUrl("");
  }

  async function toggleActive(h: OutgoingWebhook) {
    await fetch("/api/webhooks-out", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: h.id, isActive: !h.isActive }),
    });
    setHooks((p) =>
      p.map((x) => (x.id === h.id ? { ...x, isActive: !h.isActive } : x)),
    );
  }

  async function remove(id: string) {
    if (!confirm("Webhook'u silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/webhooks-out?id=${id}`, { method: "DELETE" });
    setHooks((p) => p.filter((h) => h.id !== id));
  }

  async function copySecret() {
    if (!lastSecret) return;
    await navigator.clipboard.writeText(lastSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <Webhook size={20} /> Giden Webhook&apos;lar
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Event&apos;leri kendi sisteminize bildirin. Her istek{" "}
          <code className="bg-gray-100 px-1 rounded">X-Wasend-Signature</code>{" "}
          header&apos;ı ile HMAC-SHA256 imzalanır.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {lastSecret && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Signing secret (sadece bir kez gösterilir):</strong>
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-2 rounded border flex-1 text-xs break-all">
              {lastSecret}
            </code>
            <button
              onClick={copySecret}
              className="bg-yellow-600 text-white px-3 py-2 rounded text-sm inline-flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check size={14} /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy size={14} /> Kopyala
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={create}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="CRM entegrasyonu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://sizin-domain.com/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event&apos;ler</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_EVENTS.map((ev) => {
              const active = selectedEvents.includes(ev);
              return (
                <button
                  key={ev}
                  type="button"
                  onClick={() => toggleEvent(ev)}
                  className={
                    "px-3 py-1.5 rounded-lg text-xs border font-mono " +
                    (active
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
                  }
                >
                  {ev}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Ekle
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {hooks.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz webhook yok</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {hooks.map((h) => (
              <div key={h.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{h.name}</span>
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded " +
                        (h.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500")
                      }
                    >
                      {h.isActive ? "aktif" : "pasif"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{h.url}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {h.events.split(",").join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(h)}
                  className={
                    "p-2 rounded-lg " +
                    (h.isActive
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-50")
                  }
                >
                  <Power size={16} />
                </button>
                <button
                  onClick={() => remove(h.id)}
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
