"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SkeletonTable } from "@/components/skeleton";

interface Message {
  id: string;
  content: string;
  direction: string;
  status: string;
  phone: string;
  createdAt: string;
  failedReason?: string | null;
  retryCount?: number;
  nextRetryAt?: string | null;
  contact: { id: string; name: string; phone: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  sent: "text-gray-500",
  delivered: "text-blue-600",
  read: "text-green-600",
  failed: "text-red-600",
  retry_pending: "text-orange-600",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "gönderildi",
  delivered: "iletildi",
  read: "okundu",
  failed: "başarısız",
  retry_pending: "tekrar denenecek",
};

function formatRelativeTime(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  if (diffMs <= 0) return "şimdi";
  if (minutes < 60) return `${minutes} dk sonra`;
  return `${hours} sa sonra`;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "retry_pending" | "failed"
  >("all");
  const [search, setSearch] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/messages?limit=200")
      .then((r) => r.json())
      .then((data) =>
        setMessages(Array.isArray(data) ? data : data.messages || []),
      )
      .finally(() => setLoading(false));
  }, []);

  async function copyPhone(phone: string) {
    await navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 1500);
  }

  const filtered = messages.filter((m) => {
    if (filter !== "all" && m.direction !== filter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.contact?.name.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const retryPendingCount = messages.filter(
    (m) => m.status === "retry_pending",
  ).length;
  const failedCount = messages.filter((m) => m.status === "failed").length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mesajlar</h2>
        <p className="text-gray-500 text-sm mt-1">WhatsApp mesaj geçmişi</p>
      </div>

      {messages.length > 0 && (
        <div className="space-y-2 mb-4">
          {(retryPendingCount > 0 || failedCount > 0) && (
            <div className="flex flex-wrap gap-2">
              {retryPendingCount > 0 && (
                <button
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "retry_pending"
                        ? "all"
                        : "retry_pending",
                    )
                  }
                  className={
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border " +
                    (statusFilter === "retry_pending"
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-orange-50")
                  }
                >
                  <Clock size={12} />
                  {retryPendingCount} mesaj kuyrukta
                </button>
              )}
              {failedCount > 0 && (
                <button
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "failed" ? "all" : "failed",
                    )
                  }
                  className={
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border " +
                    (statusFilter === "failed"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-red-50")
                  }
                >
                  <AlertCircle size={12} />
                  {failedCount} başarısız
                </button>
              )}
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="px-3 py-1.5 text-xs rounded-lg text-gray-500 hover:text-gray-700"
                >
                  Filtreyi temizle ×
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mesaj, kişi veya telefon ara..."
              aria-label="Mesaj ara"
              className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
            />
            <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {(["all", "incoming", "outgoing"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    "px-3 py-1 text-xs rounded " +
                    (filter === f
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50")
                  }
                >
                  {f === "all" ? "Tümü" : f === "incoming" ? "Gelen" : "Giden"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={32} />}
          title="Henüz mesaj yok"
          description="WhatsApp API bağlantısı kurulduktan ve ilk mesaj alındıktan sonra burada listelenecek."
          actionLabel="WhatsApp'ı bağla"
          actionHref="/dashboard/settings"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aramanıza uygun mesaj bulunamadı
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    msg.direction === "incoming" ? "bg-blue-50" : "bg-green-50"
                  }`}
                  aria-hidden="true"
                >
                  {msg.direction === "incoming" ? (
                    <ArrowDownLeft size={16} className="text-blue-600" />
                  ) : (
                    <ArrowUpRight size={16} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.contact?.name || msg.phone}
                    </span>
                    <button
                      onClick={() => copyPhone(msg.phone)}
                      className="text-xs text-gray-500 hover:text-green-600 inline-flex items-center gap-1"
                      aria-label={`${msg.phone} numarasını kopyala`}
                    >
                      {msg.phone}
                      {copiedPhone === msg.phone ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={10} className="opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                    <span className="text-xs text-gray-400">
                      {msg.direction === "incoming" ? "Gelen" : "Giden"}
                    </span>
                    <span
                      className={
                        "text-xs font-medium " +
                        (STATUS_COLOR[msg.status] || "text-gray-400")
                      }
                    >
                      {STATUS_LABEL[msg.status] || msg.status}
                    </span>
                    {msg.status === "retry_pending" &&
                      typeof msg.retryCount === "number" &&
                      msg.retryCount > 0 && (
                        <span className="text-xs text-orange-600">
                          (deneme {msg.retryCount}/5)
                        </span>
                      )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(msg.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  {msg.status === "retry_pending" && msg.nextRetryAt && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                      <Clock size={11} />
                      <span>
                        Tekrar denenecek: {formatRelativeTime(msg.nextRetryAt)}
                      </span>
                      {msg.failedReason && (
                        <span className="text-orange-600/70 ml-1">
                          — {msg.failedReason}
                        </span>
                      )}
                    </div>
                  )}
                  {msg.status === "failed" && msg.failedReason && (
                    <div className="mt-2 inline-flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                      <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                      <span>{msg.failedReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
