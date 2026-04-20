"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ArrowUpRight, ArrowDownLeft, Copy, Check } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SkeletonTable } from "@/components/skeleton";

interface Message {
  id: string;
  content: string;
  direction: string;
  status: string;
  phone: string;
  createdAt: string;
  contact: { id: string; name: string; phone: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  sent: "text-gray-500",
  delivered: "text-blue-600",
  read: "text-green-600",
  failed: "text-red-600",
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mesajlar</h2>
        <p className="text-gray-500 text-sm mt-1">WhatsApp mesaj geçmişi</p>
      </div>

      {messages.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
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
                      {msg.status}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(msg.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
