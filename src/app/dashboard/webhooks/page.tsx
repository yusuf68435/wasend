"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Webhook,
  Power,
  Copy,
  Check,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface OutgoingWebhook {
  id: string;
  name: string;
  url: string;
  events: string;
  isActive: boolean;
  createdAt: string;
  secret?: string;
  // Faz 8: health snapshot
  lastDeliveredAt?: string | null;
  lastStatusCode?: number | null;
  lastError?: string | null;
}

interface Delivery {
  id: string;
  event: string;
  status: "success" | "failed" | "timeout" | "circuit_open";
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  payloadPreview: string | null;
  createdAt: string;
}

interface DeliveryStats {
  success24h: number;
  failed24h: number;
  total24h: number;
  successRate24h: number | null;
  p95ResponseMs: number | null;
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  const hours = Math.round(ms / 3_600_000);
  const days = Math.round(ms / 86_400_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
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
  // Faz 8: per-webhook expanded delivery panels
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<
    Record<string, { items: Delivery[]; stats: DeliveryStats } | null>
  >({});
  const [deliveryFilter, setDeliveryFilter] = useState<
    "all" | "failed"
  >("all");

  async function loadDeliveries(hookId: string, filter: "all" | "failed") {
    const url =
      filter === "failed"
        ? `/api/webhooks-out/${hookId}/deliveries?status=failed`
        : `/api/webhooks-out/${hookId}/deliveries`;
    const res = await fetch(url);
    if (!res.ok) {
      setDeliveries((d) => ({ ...d, [hookId]: null }));
      return;
    }
    const json = await res.json();
    setDeliveries((d) => ({
      ...d,
      [hookId]: { items: json.deliveries, stats: json.stats },
    }));
  }

  function toggleExpand(hookId: string) {
    if (expandedId === hookId) {
      setExpandedId(null);
    } else {
      setExpandedId(hookId);
      if (!deliveries[hookId]) {
        loadDeliveries(hookId, deliveryFilter);
      }
    }
  }

  function changeDeliveryFilter(hookId: string, filter: "all" | "failed") {
    setDeliveryFilter(filter);
    loadDeliveries(hookId, filter);
  }

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
            {hooks.map((h) => {
              const isExpanded = expandedId === h.id;
              const healthy =
                h.lastStatusCode !== null &&
                h.lastStatusCode !== undefined &&
                h.lastStatusCode >= 200 &&
                h.lastStatusCode < 300 &&
                !h.lastError;
              const everDelivered = !!h.lastDeliveredAt;
              return (
                <div key={h.id}>
                  <div className="p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {h.name}
                        </span>
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
                        {everDelivered ? (
                          <span
                            className={
                              "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded " +
                              (healthy
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700")
                            }
                          >
                            {healthy ? (
                              <CheckCircle2 size={11} />
                            ) : (
                              <XCircle size={11} />
                            )}
                            {h.lastStatusCode ?? "ERR"} ·{" "}
                            {formatRelative(h.lastDeliveredAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                            <Clock size={11} />
                            henüz tetiklenmedi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{h.url}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {h.events.split(",").join(" · ")}
                      </p>
                      {h.lastError && (
                        <p className="text-xs text-red-600 mt-1 flex items-start gap-1">
                          <AlertCircle
                            size={11}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <span className="break-words">{h.lastError}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExpand(h.id)}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg inline-flex items-center gap-1 text-xs"
                      aria-label="Delivery geçmişini göster"
                    >
                      <Activity size={14} />
                      {isExpanded ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>
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
                  {isExpanded && (
                    <DeliveryPanel
                      hookId={h.id}
                      data={deliveries[h.id]}
                      filter={deliveryFilter}
                      onFilterChange={(f) => changeDeliveryFilter(h.id, f)}
                      onRefresh={() => loadDeliveries(h.id, deliveryFilter)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  timeout: "bg-orange-50 text-orange-700 border-orange-200",
  circuit_open: "bg-yellow-50 text-yellow-800 border-yellow-200",
};

const STATUS_LABEL: Record<string, string> = {
  success: "başarılı",
  failed: "başarısız",
  timeout: "timeout",
  circuit_open: "circuit açık",
};

function DeliveryPanel({
  data,
  filter,
  onFilterChange,
  onRefresh,
}: {
  hookId: string;
  data: { items: Delivery[]; stats: DeliveryStats } | null | undefined;
  filter: "all" | "failed";
  onFilterChange: (f: "all" | "failed") => void;
  onRefresh: () => void;
}) {
  if (data === undefined) {
    return (
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Yükleniyor...
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="px-4 py-3 bg-red-50 border-t border-red-200 text-xs text-red-700">
        Delivery geçmişi yüklenemedi
      </div>
    );
  }
  const { items, stats } = data;

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      {/* Stats */}
      <div className="px-4 py-3 border-b border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Başarı (24s)" value={stats.success24h} tone="green" />
        <Stat label="Başarısız (24s)" value={stats.failed24h} tone="red" />
        <Stat
          label="Başarı oranı"
          value={
            stats.successRate24h !== null
              ? `%${Math.round(stats.successRate24h * 100)}`
              : "—"
          }
          tone={
            stats.successRate24h === null
              ? "gray"
              : stats.successRate24h > 0.95
                ? "green"
                : stats.successRate24h > 0.7
                  ? "orange"
                  : "red"
          }
        />
        <Stat
          label="p95 cevap süresi"
          value={stats.p95ResponseMs !== null ? `${stats.p95ResponseMs}ms` : "—"}
          tone="gray"
        />
      </div>

      {/* Filter */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-2">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
          {(["all", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={
                "px-2.5 py-1 text-xs rounded " +
                (filter === f
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50")
              }
            >
              {f === "all" ? "Tümü" : "Başarısız"}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-gray-600 hover:text-gray-900 ml-auto"
        >
          Yenile
        </button>
      </div>

      {/* Deliveries list */}
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-gray-400">
          {filter === "failed"
            ? "Başarısız delivery yok"
            : "Henüz delivery kaydı yok"}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {items.map((d) => (
            <div key={d.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span
                  className={
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium " +
                    (STATUS_TONE[d.status] ||
                      "bg-gray-100 text-gray-700 border-gray-200")
                  }
                >
                  {d.status === "success" ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <XCircle size={10} />
                  )}
                  {STATUS_LABEL[d.status] || d.status}
                </span>
                <code className="font-mono text-gray-700">{d.event}</code>
                {d.statusCode !== null && (
                  <span className="text-gray-500">HTTP {d.statusCode}</span>
                )}
                {d.responseTimeMs !== null && (
                  <span className="text-gray-500">{d.responseTimeMs}ms</span>
                )}
                <span className="text-gray-400 ml-auto">
                  {new Date(d.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
              {d.errorMessage && (
                <div className="mt-1 text-xs text-red-700 break-words">
                  {d.errorMessage}
                </div>
              )}
              {d.payloadPreview && (
                <details className="mt-1">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Payload göster
                  </summary>
                  <pre className="mt-1 text-xs bg-white border border-gray-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                    {d.payloadPreview}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "green" | "red" | "orange" | "gray";
}) {
  const TONE: Record<string, string> = {
    green: "text-green-700",
    red: "text-red-700",
    orange: "text-orange-700",
    gray: "text-gray-700",
  };
  return (
    <div>
      <div className={`text-lg font-semibold ${TONE[tone]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
