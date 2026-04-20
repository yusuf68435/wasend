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
          <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
            <Flag size={22} /> Feature Flags
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Yeni özellikleri aşamalı yayınlayın. Rollout %&apos;si stable hash ile
            kullanıcı bazlı dağıtılır.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
        >
          <Plus size={16} /> Yeni Flag
        </button>
      </div>

      {msg && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2 rounded">
          {msg}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={createFlag}
          className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3"
        >
          <h3 className="font-semibold text-slate-900">Yeni Flag</h3>
          <div>
            <label htmlFor="flag-key" className="text-xs text-slate-600 mb-1 block">
              Key (küçük harf, rakam, _, -)
            </label>
            <input
              id="flag-key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              pattern="[a-z0-9][a-z0-9_-]*"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="yeni-dashboard"
            />
          </div>
          <div>
            <label htmlFor="flag-desc" className="text-xs text-slate-600 mb-1 block">
              Açıklama
            </label>
            <input
              id="flag-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Yeni dashboard UI"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {busy ? "Oluşturuluyor..." : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400">Yükleniyor...</p>
      ) : flags.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Flag size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">Henüz flag yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {f.key}
                    </code>
                    <label className="inline-flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        onChange={(e) => updateFlag(f.id, { enabled: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600"
                      />
                      <span className={f.enabled ? "text-green-700" : "text-slate-400"}>
                        {f.enabled ? "Aktif" : "Kapalı"}
                      </span>
                    </label>
                  </div>
                  {f.description && (
                    <p className="text-sm text-slate-600">{f.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteFlag(f.id, f.key)}
                  className="text-slate-400 hover:text-red-600"
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
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
                    className="text-xs text-slate-600 mb-1 block"
                  >
                    Plan filtresi (virgüllü, boş=hepsi)
                  </label>
                  <input
                    id={`plans-${f.id}`}
                    defaultValue={f.targetPlans ?? ""}
                    onBlur={(e) =>
                      updateFlag(f.id, { targetPlans: e.target.value || null })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
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
