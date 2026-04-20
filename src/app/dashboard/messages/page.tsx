"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Message {
  id: string;
  content: string;
  direction: string;
  status: string;
  phone: string;
  createdAt: string;
  contact: { name: string; phone: string } | null;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages?limit=200")
      .then((r) => r.json())
      .then((data) =>
        setMessages(Array.isArray(data) ? data : data.messages || []),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mesajlar</h2>
        <p className="text-gray-500 text-sm mt-1">WhatsApp mesaj geçmişi</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Yükleniyor...</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Henüz mesaj yok</p>
          <p className="text-gray-400 text-sm mt-1">
            WhatsApp API bağlantısı kurulduktan sonra mesajlar burada görünecek
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${msg.direction === "incoming" ? "bg-blue-50" : "bg-green-50"}`}>
                  {msg.direction === "incoming" ? (
                    <ArrowDownLeft size={16} className="text-blue-600" />
                  ) : (
                    <ArrowUpRight size={16} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.contact?.name || msg.phone}
                    </span>
                    <span className="text-xs text-gray-400">
                      {msg.direction === "incoming" ? "Gelen" : "Giden"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
