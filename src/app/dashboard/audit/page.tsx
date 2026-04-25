"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Key,
  Webhook,
  RotateCw,
  ShieldAlert,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | string | null;
  ip: string | null;
  createdAt: string;
}

const ACTION_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }>; tone: string }
> = {
  "api_key.create": {
    label: "API anahtarı oluşturuldu",
    icon: Key,
    tone: "bg-green-50 text-green-700 border-green-200",
  },
  "api_key.revoke": {
    label: "API anahtarı iptal edildi",
    icon: Key,
    tone: "bg-red-50 text-red-700 border-red-200",
  },
  "webhook.create": {
    label: "Webhook eklendi",
    icon: Webhook,
    tone: "bg-green-50 text-green-700 border-green-200",
  },
  "webhook.delete": {
    label: "Webhook silindi",
    icon: Webhook,
    tone: "bg-red-50 text-red-700 border-red-200",
  },
  "webhook.enable": {
    label: "Webhook aktif edildi",
    icon: Webhook,
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "webhook.disable": {
    label: "Webhook devre dışı bırakıldı",
    icon: Webhook,
    tone: "bg-gray-50 text-gray-700 border-gray-200",
  },
  "webhook.secret_rotated": {
    label: "Webhook secret döndürüldü",
    icon: RotateCw,
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const FILTER_OPTIONS = [
  { value: "", label: "Tüm eylemler" },
  { value: "api_key.create", label: "API key oluşturma" },
  { value: "api_key.revoke", label: "API key iptal" },
  { value: "webhook.create", label: "Webhook ekleme" },
  { value: "webhook.delete", label: "Webhook silme" },
];

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  const hours = Math.round(ms / 3_600_000);
  const days = Math.round(ms / 86_400_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(action: string) {
    setLoading(true);
    const url = action ? `/api/audit?action=${action}` : "/api/audit";
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      setLogs(json.logs);
    }
    setLoading(false);
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <ScrollText size={20} /> Etkinlik Geçmişi
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Hesabınızda gerçekleşen hassas eylemlerin (anahtar, webhook,
          ayar değişikliği) zaman damgalı listesi. Güvenlik incelemesi için
          IP adresi de tutulur.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={
              "text-xs px-3 py-1.5 rounded-full border " +
              (filter === o.value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Yükleniyor...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            <ShieldAlert
              size={24}
              className="mx-auto mb-2 text-gray-300"
            />
            Bu filtreye ait kayıt yok
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map((log) => {
              const meta = ACTION_META[log.action] ?? {
                label: log.action,
                icon: ScrollText,
                tone: "bg-gray-50 text-gray-700 border-gray-200",
              };
              const Icon = meta.icon;
              const details =
                log.details && typeof log.details === "object"
                  ? (log.details as Record<string, unknown>)
                  : null;
              return (
                <li key={log.id} className="p-4 flex items-start gap-3">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${meta.tone}`}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {meta.label}
                      </span>
                      <code className="text-[10px] text-gray-400 font-mono">
                        {log.action}
                      </code>
                    </div>
                    {details && (
                      <div className="mt-1 text-xs text-gray-600">
                        {details.name ? (
                          <span>
                            <strong>Ad:</strong> {String(details.name)}
                          </span>
                        ) : null}
                        {details.url ? (
                          <span className="ml-3">
                            <strong>URL:</strong>{" "}
                            <code className="font-mono">
                              {String(details.url)}
                            </code>
                          </span>
                        ) : null}
                        {details.scopes ? (
                          <span className="ml-3">
                            <strong>Scope:</strong>{" "}
                            {Array.isArray(details.scopes)
                              ? details.scopes.join(", ")
                              : String(details.scopes)}
                          </span>
                        ) : null}
                        {details.prefix ? (
                          <span className="ml-3">
                            <strong>Önek:</strong>{" "}
                            <code className="font-mono">
                              {String(details.prefix)}…
                            </code>
                          </span>
                        ) : null}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-3">
                      <span title={new Date(log.createdAt).toLocaleString("tr-TR")}>
                        {formatRelative(log.createdAt)}
                      </span>
                      {log.ip && (
                        <span className="font-mono">IP: {log.ip}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
