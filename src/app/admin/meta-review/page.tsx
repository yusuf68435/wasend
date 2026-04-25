"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface UrlCheck {
  ok: boolean;
  detail?: string;
  url?: string;
  status?: number;
}

interface UrlEntry {
  label: string;
  purpose: string;
  metaPanelField: string;
  path: string;
  fullUrl: string | null;
  check: UrlCheck;
}

interface ReviewData {
  ready: boolean;
  baseUrl: string | null;
  env: Record<string, boolean>;
  urlChecks: UrlEntry[];
  additionalUrls: {
    webhookUrl: string | null;
    oauthRedirectUrl: string | null;
  };
  submissionChecklist: Array<{ item: string; complete: boolean }>;
}

export default function MetaReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/meta-review");
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      const json = (await res.json()) as ReviewData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İstek başarısız");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading && !data) {
    return (
      <div className="text-sm text-[#6e6e73]">Readiness kontrol ediliyor...</div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-[#ff453a]">Veri alınamadı: {error}</div>
    );
  }

  const completedCount = data.submissionChecklist.filter(
    (c) => c.complete,
  ).length;
  const totalCount = data.submissionChecklist.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
            Meta App Review
          </h2>
          <p className="text-sm text-[#6e6e73] mt-1">
            Meta'ya production access için submission öncesi readiness kontrolü.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#d2d2d7] hover:bg-[#f5f5f7] disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {/* Overall status */}
      <div
        className={`rounded-xl border p-4 ${
          data.ready
            ? "bg-[#30d158]/10 border-[#30d158]/30"
            : "bg-[#ff9f0a]/10 border-[#ff9f0a]/30"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {data.ready ? (
            <CheckCircle2 size={20} className="text-[#30d158]" />
          ) : (
            <AlertCircle size={20} className="text-[#ff9f0a]" />
          )}
          <div>
            <div className="text-base font-semibold text-[#1d1d1f]">
              {data.ready
                ? "Submission'a hazır ✓"
                : `${completedCount}/${totalCount} adım tamamlandı`}
            </div>
            <div className="text-xs text-[#6e6e73] mt-0.5">
              {data.ready
                ? "Tüm gereksinimler karşılanmış. Meta paneline aşağıdaki URL'leri girip submission'ı başlatabilirsin."
                : "Eksik adımları tamamla, sonra submission yap."}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <Section icon={<ClipboardCheck size={14} />} title="Submission Checklist">
        <div className="bg-white rounded-xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
          {data.submissionChecklist.map((c, idx) => (
            <div key={idx} className="px-4 py-2.5 flex items-center gap-2.5">
              {c.complete ? (
                <CheckCircle2
                  size={16}
                  className="text-[#30d158] flex-shrink-0"
                />
              ) : (
                <XCircle size={16} className="text-[#ff453a] flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  c.complete ? "text-[#1d1d1f]" : "text-[#1d1d1f] font-medium"
                }`}
              >
                {c.item}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* URLs to enter into Meta panel */}
      <Section
        icon={<ExternalLink size={14} />}
        title="Meta paneline girilecek URL'ler"
        subtitle="Aşağıdaki URL'leri Meta App Dashboard → Settings altında ilgili alanlara kopyala"
      >
        <div className="bg-white rounded-xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
          {data.urlChecks.map((u) => (
            <div key={u.path} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#1d1d1f]">
                      {u.label}
                    </span>
                    <StatusBadge ok={u.check.ok} status={u.check.status} />
                  </div>
                  <div className="text-xs text-[#6e6e73] mt-0.5">
                    {u.metaPanelField}
                  </div>
                  {u.fullUrl ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-[#0071e3] bg-[#0071e3]/5 border border-[#0071e3]/20 rounded px-2 py-1">
                      {u.fullUrl}
                      <button
                        onClick={() => copy(u.fullUrl!)}
                        className="ml-1 text-[#0071e3] hover:text-[#0061c1]"
                        aria-label="URL'i kopyala"
                      >
                        {copied === u.fullUrl ? (
                          <Check size={11} />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-[#ff9f0a]">
                      NEXTAUTH_URL tanımlı değil — full URL üretilemiyor
                    </div>
                  )}
                  {!u.check.ok && u.check.detail && (
                    <div className="mt-2 inline-flex items-start gap-1.5 text-xs text-[#ff453a] bg-[#ff453a]/5 border border-[#ff453a]/20 rounded px-2 py-1">
                      <AlertCircle
                        size={11}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <span>{u.check.detail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Additional URLs (webhook, OAuth) */}
      {(data.additionalUrls.webhookUrl ||
        data.additionalUrls.oauthRedirectUrl) && (
        <Section
          icon={<ExternalLink size={14} />}
          title="Ek URL'ler (webhook & OAuth)"
          subtitle="WhatsApp Cloud API ve Meta Login config'ine girilir"
        >
          <div className="bg-white rounded-xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
            {data.additionalUrls.webhookUrl && (
              <UrlRow
                label="Webhook URL"
                hint="WhatsApp → Configuration → Callback URL"
                url={data.additionalUrls.webhookUrl}
                onCopy={copy}
                copied={copied}
              />
            )}
            {data.additionalUrls.oauthRedirectUrl && (
              <UrlRow
                label="OAuth Redirect URL"
                hint="Meta Login → Valid OAuth Redirect URIs"
                url={data.additionalUrls.oauthRedirectUrl}
                onCopy={copy}
                copied={copied}
              />
            )}
          </div>
        </Section>
      )}

      {/* Env vars */}
      <Section
        icon={<ClipboardCheck size={14} />}
        title="Production Env Vars"
        subtitle="Eksik olan varsa .env veya VPS environment'a ekle, deploy yenile"
      >
        <div className="bg-white rounded-xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
          {Object.entries(data.env).map(([key, ok]) => (
            <div
              key={key}
              className="px-4 py-2.5 flex items-center gap-2.5 justify-between"
            >
              <div className="flex items-center gap-2.5">
                {ok ? (
                  <CheckCircle2 size={16} className="text-[#30d158]" />
                ) : (
                  <XCircle size={16} className="text-[#ff453a]" />
                )}
                <code className="text-xs font-mono text-[#1d1d1f]">{key}</code>
              </div>
              <span
                className={`text-xs font-medium ${
                  ok ? "text-[#30d158]" : "text-[#ff453a]"
                }`}
              >
                {ok ? "set" : "eksik"}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function StatusBadge({ ok, status }: { ok: boolean; status?: number }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#30d158] bg-[#30d158]/10 border border-[#30d158]/30 rounded px-1.5 py-0.5">
        <CheckCircle2 size={10} />
        {status ?? 200}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/30 rounded px-1.5 py-0.5">
      <XCircle size={10} />
      {status ? `HTTP ${status}` : "Erişilemedi"}
    </span>
  );
}

function UrlRow({
  label,
  hint,
  url,
  onCopy,
  copied,
}: {
  label: string;
  hint: string;
  url: string;
  onCopy: (s: string) => void;
  copied: string | null;
}) {
  return (
    <div className="px-4 py-3">
      <div className="text-sm font-medium text-[#1d1d1f]">{label}</div>
      <div className="text-xs text-[#6e6e73] mt-0.5">{hint}</div>
      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-[#0071e3] bg-[#0071e3]/5 border border-[#0071e3]/20 rounded px-2 py-1">
        {url}
        <button
          onClick={() => onCopy(url)}
          className="ml-1 text-[#0071e3] hover:text-[#0061c1]"
          aria-label="URL'i kopyala"
        >
          {copied === url ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1d1d1f]">
          {icon}
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[#6e6e73] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
