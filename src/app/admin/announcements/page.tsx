"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Megaphone, Power, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  level: string;
  audience: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  createdBy: { email: string; name: string };
  _count: { dismissals: number };
}

const LEVEL_ICON: Record<string, { icon: React.ReactNode; cls: string }> = {
  info: { icon: <Info size={14} />, cls: "bg-blue-50 text-blue-700 border-blue-200" },
  warning: { icon: <AlertTriangle size={14} />, cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  critical: { icon: <AlertTriangle size={14} />, cls: "bg-red-50 text-red-700 border-red-200" },
  success: { icon: <CheckCircle2 size={14} />, cls: "bg-green-50 text-green-700 border-green-200" },
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [level, setLevel] = useState("info");
  const [audience, setAudience] = useState("all");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/announcements");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        level,
        audience,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Oluşturulamadı");
      return;
    }
    setTitle("");
    setContent("");
    setEndsAt("");
    load();
  }

  async function toggle(id: string, current: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Silinsin mi?")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
          <Megaphone size={22} /> Sistem Duyuruları
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Tüm kiracılara (veya belirli plana) gösterilecek duyuru bannerları.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      <form
        onSubmit={create}
        className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4"
      >
        <h3 className="font-semibold text-slate-900">Yeni Duyuru</h3>
        <div className="grid grid-cols-3 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Başlık"
            className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="info">Bilgi</option>
            <option value="success">Başarı</option>
            <option value="warning">Uyarı</option>
            <option value="critical">Kritik</option>
          </select>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          placeholder="İçerik..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="all">Herkes</option>
            <option value="starter">Starter planı</option>
            <option value="pro">Pro planı</option>
            <option value="business">Business planı</option>
          </select>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            placeholder="Bitiş (opsiyonel)"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Yayınla
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Henüz duyuru yok</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((a) => {
              const style = LEVEL_ICON[a.level] || LEVEL_ICON.info;
              return (
                <div key={a.id} className="p-4 flex items-start gap-4">
                  <div className={`px-2 py-1 rounded border text-xs inline-flex items-center gap-1 ${style.cls}`}>
                    {style.icon} {a.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{a.title}</span>
                      {a.isActive ? (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">aktif</span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">pasif</span>
                      )}
                      <span className="text-xs text-slate-400">· hedef: {a.audience}</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      {a._count.dismissals} kişi kapattı · {a.createdBy.email} ·{" "}
                      {new Date(a.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(a.id, a.isActive)}
                    className={
                      "p-2 rounded-lg " +
                      (a.isActive ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-50")
                    }
                    title={a.isActive ? "Pasifleştir" : "Aktifleştir"}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
