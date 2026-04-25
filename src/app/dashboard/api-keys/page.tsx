"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Activity,
} from "lucide-react";

type Scope = "read" | "send" | "write";
const ALL_SCOPES: Scope[] = ["read", "send", "write"];

const SCOPE_DESC: Record<Scope, string> = {
  read: "GET endpoint'leri (kişi listesi, mesaj geçmişi)",
  send: "Mesaj gönderimi, flow trigger",
  write: "Kişi oluşturma/güncelleme",
};

const SCOPE_TONE: Record<Scope, string> = {
  read: "bg-blue-50 text-blue-700 border-blue-200",
  send: "bg-green-50 text-green-700 border-green-200",
  write: "bg-purple-50 text-purple-700 border-purple-200",
};

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: Scope[];
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  usageCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">(365);
  const [scopes, setScopes] = useState<Scope[]>([...ALL_SCOPES]);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((r) => (r.ok ? r.json() : []))
      .then(setKeys);
  }, []);

  function toggleScope(s: Scope) {
    setScopes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPlaintext(null);
    if (scopes.length === 0) {
      setError("En az bir scope seçmelisin");
      return;
    }
    const body: Record<string, unknown> = { name, scopes };
    if (typeof expiresInDays === "number" && expiresInDays > 0) {
      body.expiresInDays = expiresInDays;
    }

    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Oluşturulamadı");
      return;
    }
    const k = await res.json();
    setPlaintext(k.plaintext);
    // Yeni key'i list'e prepend; UI alanları için varsayılan değerleri doldur.
    setKeys((p) => [
      {
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        scopes: k.scopes ?? scopes,
        lastUsedAt: null,
        lastUsedIp: null,
        usageCount: 0,
        expiresAt: k.expiresAt ?? null,
        revokedAt: null,
        createdAt: k.createdAt ?? new Date().toISOString(),
      },
      ...p,
    ]);
    setName("");
  }

  async function revoke(id: string) {
    if (!confirm("Anahtarı iptal etmek istediğinize emin misiniz?")) return;
    await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    setKeys((p) =>
      p.map((k) =>
        k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k,
      ),
    );
  }

  async function copyPlaintext() {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <Key size={20} /> API Anahtarları
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Public API v1 erişimi için Bearer token. Örn:{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">
            POST /api/v1/messages/send
          </code>{" "}
          —{" "}
          <a
            href="/docs/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 underline"
          >
            API Dokümantasyonu
          </a>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {plaintext && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle
              size={18}
              className="text-yellow-600 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-yellow-800">
              <strong>Bu anahtar sadece bir kez gösterilir.</strong>{" "}
              Güvenli bir yere kaydedin — sonradan görüntülenemez.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-2 rounded border flex-1 text-xs break-all">
              {plaintext}
            </code>
            <button
              onClick={copyPlaintext}
              className="bg-yellow-600 text-white px-3 py-2 rounded text-sm inline-flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check size={14} /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy size={14} /> Kopyala
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={create}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Yeni Anahtar</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İsim
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Entegrasyon — Zapier"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Süre (gün, boş = süresiz)
            </label>
            <input
              type="number"
              min={1}
              max={3650}
              value={expiresInDays}
              onChange={(e) =>
                setExpiresInDays(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scope (Erişim İzinleri)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_SCOPES.map((s) => {
              const active = scopes.includes(s);
              return (
                <label
                  key={s}
                  className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition ${
                    active
                      ? SCOPE_TONE[s]
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleScope(s)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono font-semibold">{s}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {SCOPE_DESC[s]}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            En az bir scope seçilmeli. Sadece ihtiyacın olan izinleri ver — key
            sızarsa hasarı sınırlar.
          </p>
        </div>

        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Oluştur
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {keys.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz anahtar yok</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  İsim
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Önek
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Scope
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Kullanım
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Son Kullanım
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Durum
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {k.prefix}…
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(k.scopes || []).map((s) => (
                        <span
                          key={s}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            SCOPE_TONE[s as Scope] ??
                            "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="inline-flex items-center gap-1">
                      <Activity size={12} className="text-gray-400" />
                      {(k.usageCount ?? 0).toLocaleString("tr-TR")}
                    </div>
                    {k.lastUsedIp && (
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {k.lastUsedIp}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {k.revokedAt ? (
                      <span className="text-red-600">İptal edildi</span>
                    ) : k.expiresAt && new Date(k.expiresAt) < new Date() ? (
                      <span className="text-orange-600">Süresi doldu</span>
                    ) : (
                      <span className="text-green-600">Aktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!k.revokedAt && (
                      <button
                        onClick={() => revoke(k.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
