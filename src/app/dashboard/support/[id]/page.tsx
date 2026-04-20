"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Lock } from "lucide-react";

interface Message {
  id: string;
  authorId: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages: Message[];
  user: { id: string; email: string; name: string; businessName: string | null };
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

export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/support/tickets/${id}`);
    if (res.ok) {
      const d = await res.json();
      setTicket(d.ticket);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !reply.trim()) return;
    setBusy(true);
    await fetch(`/api/support/tickets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setReply("");
    setBusy(false);
    load();
  }

  async function close() {
    if (!id) return;
    if (!window.confirm("Bu talebi kapatmak istediğinize emin misiniz?")) return;
    setBusy(true);
    await fetch(`/api/support/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    setBusy(false);
    load();
  }

  if (!ticket) return <div className="text-gray-400">Yükleniyor...</div>;

  return (
    <div>
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={14} /> Tüm talepler
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{ticket.subject}</h2>
            <p className="text-xs text-gray-500">
              {new Date(ticket.createdAt).toLocaleString("tr-TR")}
            </p>
          </div>
          <span
            className={
              "text-xs px-2 py-0.5 rounded-full " +
              (STATUS_COLOR[ticket.status] || "bg-gray-100 text-gray-700")
            }
          >
            {STATUS_LABEL[ticket.status] || ticket.status}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            className={
              "rounded-xl p-4 " +
              (m.authorRole === "admin"
                ? "bg-green-50 border border-green-200 ml-8"
                : "bg-white border border-gray-200 mr-8")
            }
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">
                {m.authorRole === "admin" ? "WaSend Destek" : "Siz"}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(m.createdAt).toLocaleString("tr-TR")}
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>

      {ticket.status === "closed" ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500 inline-flex items-center gap-2 justify-center">
          <Lock size={14} /> Bu talep kapalı
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
        >
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Yanıtınızı yazın..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Talebi Kapat
            </button>
            <button
              type="submit"
              disabled={busy || !reply.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Send size={14} /> Gönder
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
