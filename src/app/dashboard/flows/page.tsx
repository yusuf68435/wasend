"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Zap, Power } from "lucide-react";

interface Flow {
  id: string;
  name: string;
  trigger: string;
  triggerValue: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("keyword");
  const [triggerValue, setTriggerValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/flows")
      .then((r) => (r.ok ? r.json() : []))
      .then(setFlows);
  }, []);

  async function createFlow(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const startId = "start-1";
    const defaultGraph = {
      startId,
      nodes: [
        {
          id: startId,
          type: "start",
          data: {},
          next: "msg-1",
        },
        {
          id: "msg-1",
          type: "message",
          data: { text: "Merhaba! Size nasıl yardımcı olabilirim?" },
          next: null,
        },
      ],
    };
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        trigger,
        triggerValue: triggerValue || null,
        nodes: JSON.stringify(defaultGraph),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Oluşturulamadı");
      return;
    }
    const flow = await res.json();
    setFlows((prev) => [flow, ...prev]);
    setName("");
    setTriggerValue("");
  }

  async function toggleActive(f: Flow) {
    const res = await fetch("/api/flows", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, isActive: !f.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFlows((prev) => prev.map((x) => (x.id === f.id ? updated : x)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Akışı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/flows?id=${id}`, { method: "DELETE" });
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <Zap size={22} className="text-yellow-500" /> Chatbot Akışları
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Keyword veya yeni kontak tetikleyicisiyle başlayan, çok adımlı diyalog
          akışları. Meta 2026 kuralı: her akışın net bir hedefi olmalı.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={createFlow}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Yeni Akış</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Randevu oluşturma"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tetikleyici</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="keyword">Anahtar kelime</option>
              <option value="new_contact">Yeni kontak</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tetik Değeri</label>
            <input
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              disabled={trigger === "new_contact"}
              placeholder={trigger === "keyword" ? "randevu" : "—"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Oluştur
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {flows.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz akış yok</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {flows.map((f) => (
              <div key={f.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{f.name}</span>
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded " +
                        (f.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600")
                      }
                    >
                      {f.isActive ? "aktif" : "pasif"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {f.trigger === "keyword"
                      ? `Anahtar: "${f.triggerValue ?? ""}"`
                      : "Yeni kontakta"}
                  </p>
                </div>
                <Link
                  href={`/dashboard/flows/${f.id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Düzenle
                </Link>
                <button
                  onClick={() => toggleActive(f)}
                  title={f.isActive ? "Pasifleştir" : "Aktifleştir"}
                  className={
                    "p-2 rounded-lg " +
                    (f.isActive
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-50")
                  }
                >
                  <Power size={16} />
                </button>
                <button
                  onClick={() => remove(f.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
