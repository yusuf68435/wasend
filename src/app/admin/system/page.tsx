"use client";

import { useEffect, useState } from "react";
import { Cpu, Database, Server, CheckCircle2, XCircle, AlertTriangle, Radio } from "lucide-react";

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
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      const load = () =>
        fetch("/api/admin/system")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d) {
              setData(d);
              setLastUpdate(Date.now());
            }
          });
      load();
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }

    const es = new EventSource("/api/admin/system/stream");
    es.addEventListener("snapshot", (e) => {
      try {
        const parsed = JSON.parse((e as MessageEvent).data) as SystemData;
        setData(parsed);
        setLive(true);
        setLastUpdate(Date.now());
      } catch {
        // ignore malformed
      }
    });
    es.onerror = () => {
      setLive(false);
    };
    return () => es.close();
  }, []);

  if (!data) return <div className="text-[#86868b] text-[13px]">Yükleniyor...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="display-md text-[#1d1d1f] inline-flex items-center gap-2">
          <Cpu size={22} /> Sistem Sağlığı
        </h2>
        <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1 inline-flex items-center gap-2">
          {live ? (
            <>
              <Radio size={12} className="text-[#1d7a3a] animate-pulse" />
              <span>Canlı yayın — 5 saniyede güncelleniyor</span>
            </>
          ) : (
            <span>DB + host metrikleri (yedek polling 15sn)</span>
          )}
          {lastUpdate && (
            <span className="text-[#86868b] text-[11px]">
              · son: {new Date(lastUpdate).toLocaleTimeString("tr-TR")}
            </span>
          )}
        </p>
      </div>

      {data.alerts.failedMessages24h > 0 && (
        <div className="mb-4 bg-[#ff453a]/10 border border-[#ff453a]/20 text-[#ff453a] rounded-2xl px-4 py-3 text-[13px] tracking-tight inline-flex items-center gap-2">
          <AlertTriangle size={16} />
          Son 24 saatte <strong>{data.alerts.failedMessages24h}</strong> başarısız mesaj var.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3 inline-flex items-center gap-2">
            <Database size={16} /> PostgreSQL
          </h3>
          <dl className="text-[13px] space-y-1">
            <Row k="Boyut" v={data.db.sizeHuman} />
            <Row k="Aktif bağlantı" v={data.db.connections} />
            <Row k="Tablo" v={data.db.tableCount} />
            <Row k="Commit" v={data.db.commits.toLocaleString("tr-TR")} />
            <Row k="Rollback" v={data.db.rollbacks.toLocaleString("tr-TR")} />
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3 inline-flex items-center gap-2">
            <Server size={16} /> Host
          </h3>
          <dl className="text-[13px] space-y-1">
            <Row k="Hostname" v={data.host.hostname} />
            <Row k="Platform" v={`${data.host.platform}/${data.host.arch}`} />
            <Row k="CPU" v={`${data.host.cpuCount} çekirdek`} />
            <Row k="Load Avg" v={data.host.loadAvg.map((n) => n.toFixed(2)).join(" ")} />
            <Row k="Bellek" v={`${data.host.memUsagePct}% (${data.host.memTotalMB - data.host.memFreeMB}/${data.host.memTotalMB} MB)`} />
            <Row k="Uptime" v={formatDuration(data.host.uptimeSeconds)} />
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">Node.js</h3>
          <dl className="text-[13px] space-y-1">
            <Row k="Versiyon" v={data.node.version} />
            <Row k="Proses Uptime" v={formatDuration(data.node.uptimeSeconds)} />
            <Row k="RSS bellek" v={`${data.node.rssMB} MB`} />
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-3">Ortam Değişkenleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(data.env).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-xl border border-[#d2d2d7] bg-[#fbfbfd]"
            >
              {v ? (
                <CheckCircle2 size={14} className="text-[#1d7a3a] flex-shrink-0" />
              ) : (
                <XCircle size={14} className="text-[#ff453a] flex-shrink-0" />
              )}
              <span className="text-[#1d1d1f] text-[11px] tracking-tight">
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
      <dt className="text-[#6e6e73]">{k}</dt>
      <dd className="text-[#1d1d1f] text-right font-mono text-[11px]">{v}</dd>
    </div>
  );
}
