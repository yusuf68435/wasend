"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Play,
  XCircle,
} from "lucide-react";

interface MessageRow {
  id: string;
  content: string;
  phone: string;
  status: string;
  retryCount: number;
  nextRetryAt: string | null;
  failedReason: string | null;
  createdAt: string;
  user: { email: string; name: string | null } | null;
  contact: { name: string | null; phone: string } | null;
}

interface RetryQueueData {
  stats: {
    pendingTotal: number;
    dueNow: number;
    upcoming: number;
    failed24h: number;
    sent24h: number;
  };
  dueMessages: MessageRow[];
  upcomingMessages: MessageRow[];
  recentFailed: MessageRow[];
  byUser: Array<{
    userId: string;
    email: string | null;
    name: string | null;
    pendingCount: number;
  }>;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);
  const seconds = Math.round(absMs / 1000);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);
  const past = diffMs < 0;
  if (seconds < 60) return past ? `${seconds} sn önce` : `${seconds} sn sonra`;
  if (minutes < 60) return past ? `${minutes} dk önce` : `${minutes} dk sonra`;
  if (hours < 24) return past ? `${hours} sa önce` : `${hours} sa sonra`;
  return past ? `${days} gün önce` : `${days} gün sonra`;
}

export default function AdminRetryQueuePage() {
  const [data, setData] = useState<RetryQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/admin/retry-queue");
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      const json = (await res.json()) as RetryQueueData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İstek başarısız");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, []);

  async function handleAction(
    id: string,
    action: "force-retry" | "mark-failed",
  ) {
    setActionPending(id);
    try {
      const res = await fetch(`/api/admin/retry-queue/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `HTTP ${res.status}`);
      } else {
        await refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aksiyon başarısız");
    } finally {
      setActionPending(null);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-[#6e6e73]">Retry queue yükleniyor...</div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-[#ff453a]">
        Retry queue verisi alınamadı: {error}
      </div>
    );
  }

  const { stats, dueMessages, upcomingMessages, recentFailed, byUser } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          Retry Queue
        </h2>
        <p className="text-sm text-[#6e6e73] mt-1">
          Geçici hatalardan dolayı yeniden denenmeyi bekleyen mesajlar (15 sn'de
          bir otomatik yenilenir).
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs rounded-lg bg-[#ff453a]/10 text-[#ff453a] border border-[#ff453a]/30 inline-flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={<RefreshCw size={16} />}
          label="Toplam queue"
          value={stats.pendingTotal}
          tone="orange"
        />
        <StatCard
          icon={<Play size={16} />}
          label="Şu an due"
          value={stats.dueNow}
          tone="blue"
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Bekleyen"
          value={stats.upcoming}
          tone="gray"
        />
        <StatCard
          icon={<XCircle size={16} />}
          label="Failed (24s)"
          value={stats.failed24h}
          tone="red"
        />
        <StatCard
          icon={<CheckCircle2 size={16} />}
          label="Sent (24s)"
          value={stats.sent24h}
          tone="green"
        />
      </div>

      {/* By user */}
      {byUser.length > 0 && (
        <Section
          icon={<Users size={14} />}
          title="En çok queue'da olan kullanıcılar"
        >
          <div className="bg-white rounded-xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
            {byUser.map((u) => (
              <div
                key={u.userId}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#1d1d1f]">
                    {u.name ?? u.email ?? u.userId}
                  </span>
                  {u.name && u.email && (
                    <span className="text-xs text-[#6e6e73]">{u.email}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-[#ff9f0a]">
                  {u.pendingCount} mesaj
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Due now — sweeper birazdan alacak */}
      <Section
        icon={<Play size={14} />}
        title={`Şu an due (${dueMessages.length})`}
        subtitle="Sweeper bir sonraki tick'te (≤60sn) bunları işleyecek"
      >
        <MessageList
          messages={dueMessages}
          actionPending={actionPending}
          onAction={handleAction}
          emptyMessage="Şu an due mesaj yok"
        />
      </Section>

      {/* Upcoming */}
      <Section
        icon={<Clock size={14} />}
        title={`Bekleyen (${upcomingMessages.length})`}
        subtitle="Backoff süresi dolduğunda denenecek"
      >
        <MessageList
          messages={upcomingMessages}
          actionPending={actionPending}
          onAction={handleAction}
          emptyMessage="Bekleyen mesaj yok"
        />
      </Section>

      {/* Recent failed */}
      <Section
        icon={<XCircle size={14} />}
        title={`Son failed (24 saat) (${recentFailed.length})`}
        subtitle="Kalıcı failed olan mesajlar — operasyonel görünürlük"
      >
        <MessageList
          messages={recentFailed}
          actionPending={null}
          onAction={null}
          emptyMessage="Son 24 saatte failed mesaj yok"
        />
      </Section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "orange" | "blue" | "gray" | "red" | "green";
}) {
  const TONE: Record<string, string> = {
    orange: "text-[#ff9f0a] bg-[#ff9f0a]/10",
    blue: "text-[#0071e3] bg-[#0071e3]/10",
    gray: "text-[#6e6e73] bg-[#f5f5f7]",
    red: "text-[#ff453a] bg-[#ff453a]/10",
    green: "text-[#30d158] bg-[#30d158]/10",
  };
  return (
    <div className="bg-white rounded-xl border border-[#d2d2d7] p-3">
      <div
        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${TONE[tone]}`}
      >
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f]">
        {value}
      </div>
      <div className="text-xs text-[#6e6e73]">{label}</div>
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

function MessageList({
  messages,
  actionPending,
  onAction,
  emptyMessage,
}: {
  messages: MessageRow[];
  actionPending: string | null;
  onAction:
    | ((id: string, action: "force-retry" | "mark-failed") => void)
    | null;
  emptyMessage: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#d2d2d7] px-4 py-6 text-center text-xs text-[#86868b]">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
      {messages.map((m) => (
        <div key={m.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[#1d1d1f]">
                  {m.contact?.name ?? m.phone}
                </span>
                <span className="text-xs text-[#6e6e73]">{m.phone}</span>
                {m.user && (
                  <span className="text-xs text-[#86868b]">
                    · {m.user.name ?? m.user.email}
                  </span>
                )}
                <span className="text-xs text-[#ff9f0a]">
                  deneme {m.retryCount}/5
                </span>
                {m.status === "retry_pending" && m.nextRetryAt && (
                  <span className="text-xs text-[#0071e3]">
                    {formatRelative(m.nextRetryAt)}
                  </span>
                )}
                {m.status === "failed" && (
                  <span className="text-xs text-[#ff453a] font-medium">
                    failed
                  </span>
                )}
              </div>
              <p className="text-sm text-[#1d1d1f] mt-1 line-clamp-2 break-words">
                {m.content}
              </p>
              {m.failedReason && (
                <div className="mt-1.5 text-xs text-[#ff453a] bg-[#ff453a]/5 border border-[#ff453a]/20 rounded px-2 py-1 inline-flex items-start gap-1.5">
                  <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                  <span>{m.failedReason}</span>
                </div>
              )}
            </div>
            {onAction && m.status === "retry_pending" && (
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onAction(m.id, "force-retry")}
                  disabled={actionPending === m.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#0071e3] text-white hover:bg-[#0061c1] disabled:opacity-50"
                >
                  <Play size={11} />
                  Şimdi dene
                </button>
                <button
                  onClick={() => onAction(m.id, "mark-failed")}
                  disabled={actionPending === m.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] disabled:opacity-50"
                >
                  <XCircle size={11} />
                  Failed yap
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
