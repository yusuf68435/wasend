"use client";

import { useEffect, useState } from "react";
import { Cpu, Database, Server, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface SystemData {
  db: {
    sizeHuman: string;
    connections: number;
    commits: number;
    rollbacks: number;
    tableCount: number;
  };
  host: {
    hostname: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
    loadAvg: number[];
    memTotalMB: number;
    memFreeMB: number;
    memUsagePct: number;
    cpuCount: number;
  };
  node: {
    version: string;
    uptimeSeconds: number;
    rssMB: number;
  };
  env: Record<string, boolean>;
  alerts: {
    failedMessages24h: number;
  };
}

function formatDuration(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}g ${h}s`;
  if (h > 0) return `${h}s ${m}d`;
  return `${m}d`;
}

const ENV_LABEL: Record<string, string> = {
  hasWhatsAppToken: "WhatsApp API Token",
  hasWhatsAppPhoneId: "WhatsApp Phone Number ID",
  hasWhatsAppAppSecret: "WhatsApp App Secret",
  hasAnthropicKey: "Anthropic API Key (AI)",
  hasCronSecret: "Cron Secret",
  stripeEnabled: "Stripe Enabled",
};

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/admin/system")
        .then((r) => (r.ok ? r.json() : null))
        .then(setData);
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  if (!data) return <div className="text-slate-400">Yükleniyor...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
          <Cpu size={22} /> Sistem Sağlığı
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Canlı DB + host metrikleri (15sn&apos;de bir güncellenir).
        </p>
      </div>

      {data.alerts.failedMessages24h > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg inline-flex items-center gap-2">
          <AlertTriangle size={16} />
          Son 24 saatte <strong>{data.alerts.failedMessages24h}</strong> başarısız mesaj var.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 inline-flex items-center gap-2">
            <Database size={16} /> PostgreSQL
          </h3>
          <dl className="text-sm space-y-1">
            <Row k="Boyut" v={data.db.sizeHuman} />
            <Row k="Aktif bağlantı" v={data.db.connections} />
            <Row k="Tablo" v={data.db.tableCount} />
            <Row k="Commit" v={data.db.commits.toLocaleString("tr-TR")} />
            <Row k="Rollback" v={data.db.rollbacks.toLocaleString("tr-TR")} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 inline-flex items-center gap-2">
            <Server size={16} /> Host
          </h3>
          <dl className="text-sm space-y-1">
            <Row k="Hostname" v={data.host.hostname} />
            <Row k="Platform" v={`${data.host.platform}/${data.host.arch}`} />
            <Row k="CPU" v={`${data.host.cpuCount} çekirdek`} />
            <Row k="Load Avg" v={data.host.loadAvg.map((n) => n.toFixed(2)).join(" ")} />
            <Row k="Bellek" v={`${data.host.memUsagePct}% (${data.host.memTotalMB - data.host.memFreeMB}/${data.host.memTotalMB} MB)`} />
            <Row k="Uptime" v={formatDuration(data.host.uptimeSeconds)} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Node.js</h3>
          <dl className="text-sm space-y-1">
            <Row k="Versiyon" v={data.node.version} />
            <Row k="Proses Uptime" v={formatDuration(data.node.uptimeSeconds)} />
            <Row k="RSS bellek" v={`${data.node.rssMB} MB`} />
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Ortam Değişkenleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(data.env).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded border border-slate-200 bg-slate-50"
            >
              {v ? (
                <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
              ) : (
                <XCircle size={14} className="text-red-600 flex-shrink-0" />
              )}
              <span className="text-slate-700 text-xs">
                {ENV_LABEL[k] || k}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-900 text-right font-mono text-xs">{v}</dd>
    </div>
  );
}
