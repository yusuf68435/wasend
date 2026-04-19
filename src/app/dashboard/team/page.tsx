"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Copy, Check } from "lucide-react";

interface Invite {
  id: string;
  email: string;
  role: string;
  tokenPreview: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  inviteUrl?: string;
}

export default function TeamPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("AGENT");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/team/invites")
      .then((r) => (r.ok ? r.json() : []))
      .then(setInvites);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Davet oluşturulamadı");
      return;
    }
    const inv: Invite = await res.json();
    setInvites((p) => [inv, ...p]);
    setEmail("");
    setLastInviteUrl(inv.inviteUrl ?? null);
  }

  async function remove(id: string) {
    if (!confirm("Daveti iptal etmek istediğinize emin misiniz?")) return;
    await fetch(`/api/team/invites?id=${id}`, { method: "DELETE" });
    setInvites((p) => p.filter((i) => i.id !== id));
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
          <Users size={20} /> Ekip
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Ekip üyelerini rolleriyle davet edin. Davet linki 7 gün geçerlidir.
          (Email gönderimi henüz aktif değil — linki elle paylaşın.)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {lastInviteUrl && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm mb-6">
          <p className="font-medium mb-2">Davet linki oluşturuldu:</p>
          <div className="flex items-center gap-2">
            <code className="bg-white px-2 py-1 rounded text-xs flex-1 overflow-x-auto">
              {lastInviteUrl}
            </code>
            <button
              onClick={() => copyUrl(lastInviteUrl)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs inline-flex items-center gap-1"
            >
              {copied === lastInviteUrl ? (
                <>
                  <Check size={12} /> Kopyalandı
                </>
              ) : (
                <>
                  <Copy size={12} /> Kopyala
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
        <h3 className="font-semibold text-gray-900 mb-4">Yeni Davet</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="uye@ornek.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ADMIN">ADMIN (her şey + ekip)</option>
              <option value="AGENT">AGENT (mesajlar)</option>
              <option value="VIEWER">VIEWER (sadece görüntüle)</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Davet Gönder
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {invites.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz davet yok</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">E-posta</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sona Erme</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invites.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{i.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{i.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {i.usedAt ? (
                      <span className="text-green-600">Kullanıldı</span>
                    ) : new Date(i.expiresAt) < new Date() ? (
                      <span className="text-red-600">Süresi doldu</span>
                    ) : (
                      <span className="text-gray-500">Bekliyor</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(i.expiresAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(i.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
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
