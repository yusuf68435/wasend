"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Flag } from "lucide-react";

interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rolloutPct: number;
  targetPlans: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/feature-flags");
    if (res.ok) setFlags(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, [load]);

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey, description: newDesc || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || "Hata");
      return;
    }
    setMsg("Flag oluşturuldu");
    setNewKey("");
    setNewDesc("");
    setShowCreate(false);
    load();
  }

  async function updateFlag(id: string, patch: Partial<FeatureFlag>) {
    const res = await fetch(`/api/admin/feature-flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setMsg("Güncelleme hatası");
      return;
    }
    load();
  }

  async function deleteFlag(id: string, key: string) {
    if (!window.confirm(`"${key}" flag'ini silmek istediğinizden emin misiniz?`)) return;
    const res = await fetch(`/api/admin/feature-flags/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMsg("Silme hatası");
      return;
    }
    setMsg("Silindi");
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="display-md text-[#1d1d1f] inline-flex items-center gap-2">
            <Flag size={22} /> Feature Flags
          </h2>
          <p className="text-[13px] text-[#6e6e73] tracking-tight mt-1">
            Yeni özellikleri aşamalı yayınlayın. Rollout %&apos;si stable hash ile
            kullanıcı bazlı dağıtılır.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-[#1d1d1f] text-white px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
        >
          <Plus size={16} /> Yeni Flag
        </button>
      </div>

      {msg && (
        <div className="mb-4 bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 text-[#ff9f0a] rounded-2xl px-4 py-3 text-[13px] tracking-tight">
          {msg}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={createFlag}
          className="bg-white rounded-2xl border border-[#d2d2d7] p-5 mb-4 space-y-3"
        >
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">Yeni Flag</h3>
          <div>
            <label htmlFor="flag-key" className="text-[11px] text-[#6e6e73] mb-1 block tracking-tight">
              Key (küçük harf, rakam, _, -)
            </label>
            <input
              id="flag-key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              pattern="[a-z0-9][a-z0-9_-]*"
              required
              className="w-full h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              placeholder="yeni-dashboard"
            />
          </div>
          <div>
            <label htmlFor="flag-desc" className="text-[11px] text-[#6e6e73] mb-1 block tracking-tight">
              Açıklama
            </label>
            <input
              id="flag-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              placeholder="Yeni dashboard UI"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="bg-[#1d1d1f] text-white px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50"
            >
              {busy ? "Oluşturuluyor..." : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="border border-[#d2d2d7] text-[#1d1d1f] px-4 h-10 rounded-full text-[13px] font-medium tracking-tight hover:bg-[#f5f5f7] transition"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-[#86868b] text-[13px]">Yükleniyor...</p>
      ) : flags.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-8 text-center">
          <Flag size={32} className="mx-auto text-[#86868b] mb-2" />
          <p className="text-[#6e6e73] text-[13px] tracking-tight">Henüz flag yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-[#d2d2d7] p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-[13px] font-mono bg-[#f5f5f7] text-[#1d1d1f] px-2 py-0.5 rounded-full">
                      {f.key}
                    </code>
                    <label className="inline-flex items-center gap-1 text-[11px] tracking-tight">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        onChange={(e) => updateFlag(f.id, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded-[6px] border-[#d2d2d7] text-[#1d1d1f] focus:ring-[#1d1d1f]/20"
                      />
                      <span className={f.enabled ? "text-[#1d7a3a]" : "text-[#86868b]"}>
                        {f.enabled ? "Aktif" : "Kapalı"}
                      </span>
                    </label>
                  </div>
                  {f.description && (
                    <p className="text-[13px] text-[#6e6e73] tracking-tight">{f.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteFlag(f.id, f.key)}
                  className="text-[#86868b] hover:text-[#ff453a] transition"
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6e6e73] mb-1 block tracking-tight">
                    Rollout: {f.rolloutPct}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={f.rolloutPct}
                    onChange={(e) =>
                      updateFlag(f.id, { rolloutPct: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`plans-${f.id}`}
                    className="text-[11px] text-[#6e6e73] mb-1 block tracking-tight"
                  >
                    Plan filtresi (virgüllü, boş=hepsi)
                  </label>
                  <input
                    id={`plans-${f.id}`}
                    defaultValue={f.targetPlans ?? ""}
                    onBlur={(e) =>
                      updateFlag(f.id, { targetPlans: e.target.value || null })
                    }
                    className="w-full h-10 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
                    placeholder="PRO,BUSINESS"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
