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
  info: { icon: <Info size={14} />, cls: "bg-[#0071e3]/10 text-[#0071e3]" },
  warning: { icon: <AlertTriangle size={14} />, cls: "bg-[#ff9f0a]/10 text-[#ff9f0a]" },
  critical: { icon: <AlertTriangle size={14} />, cls: "bg-[#ff453a]/10 text-[#ff453a]" },
  success: { icon: <CheckCircle2 size={14} />, cls: "bg-[#30d158]/10 text-[#1d7a3a]" },
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
        <h2 className="display-md text-[#1d1d1f] inline-flex items-center gap-2">
          <Megaphone size={22} /> Sistem Duyuruları
        </h2>
        <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1">
          Tüm kiracılara (veya belirli plana) gösterilecek duyuru bannerları.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-[#ff453a]/10 border border-[#ff453a]/20 text-[#ff453a] rounded-2xl px-4 py-3 text-[13px] tracking-tight">
          {error}
        </div>
      )}

      <form
        onSubmit={create}
        className="bg-white rounded-2xl border border-[#d2d2d7] p-6 mb-6 space-y-4"
      >
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">Yeni Duyuru</h3>
        <div className="grid grid-cols-3 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Başlık"
            className="col-span-2 h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
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
          className="w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
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
            className="h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
          />
        </div>
        <button
          type="submit"
          className="bg-[#1d1d1f] text-white px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition inline-flex items-center gap-2"
        >
          <Plus size={16} /> Yayınla
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center text-[#86868b] text-[13px] py-12">Henüz duyuru yok</p>
        ) : (
          <div className="divide-y divide-[#f5f5f7]">
            {items.map((a) => {
              const style = LEVEL_ICON[a.level] || LEVEL_ICON.info;
              return (
                <div key={a.id} className="p-4 flex items-start gap-4">
                  <div className={`px-2 py-1 rounded-full text-[11px] font-medium tracking-tight inline-flex items-center gap-1 ${style.cls}`}>
                    {style.icon} {a.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#1d1d1f] text-[14px] tracking-tight">{a.title}</span>
                      {a.isActive ? (
                        <span className="text-[11px] bg-[#30d158]/10 text-[#1d7a3a] px-2 py-0.5 rounded-full font-medium tracking-tight">aktif</span>
                      ) : (
                        <span className="text-[11px] bg-[#f5f5f7] text-[#6e6e73] px-2 py-0.5 rounded-full font-medium tracking-tight">pasif</span>
                      )}
                      <span className="text-[11px] text-[#86868b]">· hedef: {a.audience}</span>
                    </div>
                    <p className="text-[13px] text-[#1d1d1f] whitespace-pre-wrap tracking-tight">{a.content}</p>
                    <div className="text-[11px] text-[#86868b] mt-2">
                      {a._count.dismissals} kişi kapattı · {a.createdBy.email} ·{" "}
                      {new Date(a.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(a.id, a.isActive)}
                    className={
                      "p-2 rounded-full transition " +
                      (a.isActive ? "text-[#1d7a3a] hover:bg-[#30d158]/10" : "text-[#86868b] hover:bg-[#f5f5f7]")
                    }
                    title={a.isActive ? "Pasifleştir" : "Aktifleştir"}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="p-2 text-[#ff453a] hover:bg-[#ff453a]/10 rounded-full transition"
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
