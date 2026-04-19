"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Eye, Filter as FilterIcon } from "lucide-react";

type RuleMode = "and" | "or";
type Op = "has" | "not-has" | "eq" | "neq" | "lt" | "gt";

interface Rule {
  field: string;
  op: Op;
  value?: string | boolean;
  daysAgo?: number;
}

interface Segment {
  id: string;
  name: string;
  rules: string;
  createdAt: string;
}

const PRESETS: Array<{ label: string; rule: Rule }> = [
  { label: "Etiket: vip", rule: { field: "tag", op: "has", value: "vip" } },
  {
    label: "Son 30 gün içinde yazanlar",
    rule: { field: "lastMessageAt", op: "gt", daysAgo: 30 },
  },
  {
    label: "30 gündür sessiz olanlar",
    rule: { field: "lastMessageAt", op: "lt", daysAgo: 30 },
  },
  { label: "Dil: tr", rule: { field: "language", op: "eq", value: "tr" } },
];

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<RuleMode>("and");
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<Record<string, number>>({});

  async function load() {
    const res = await fetch("/api/segments");
    if (res.ok) setSegments(await res.json());
  }

  useEffect(() => {
    fetch("/api/segments")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSegments);
  }, []);

  function addPreset(preset: Rule) {
    setRules((r) => [...r, preset]);
  }

  function removeRule(idx: number) {
    setRules((r) => r.filter((_, i) => i !== idx));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || rules.length === 0) {
      setError("İsim ve en az bir kural gerekli");
      return;
    }
    const res = await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        rules: JSON.stringify({ mode, rules }),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Kaydedilemedi");
      return;
    }
    setName("");
    setRules([]);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Segmenti silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/segments?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function preview(id: string) {
    const res = await fetch(`/api/segments/${id}/contacts`);
    if (res.ok) {
      const data = await res.json();
      setPreviewCount((c) => ({ ...c, [id]: data.count }));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Segmentler</h2>
        <p className="text-gray-500 text-sm mt-1">
          Dinamik kural setleriyle kişi grupları oluşturun. Broadcast&apos;lerde
          hedefleme için kullanılır.
        </p>
      </div>

      <form
        onSubmit={save}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VIP Aktif Müşteriler"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eşleme</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as RuleMode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="and">Tümü (AND)</option>
              <option value="or">Herhangi biri (OR)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hazır Kurallar</label>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => addPreset(p.rule)}
                className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 inline-flex items-center gap-1"
              >
                <Plus size={12} /> {p.label}
              </button>
            ))}
          </div>
        </div>

        {rules.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eklenen Kurallar</label>
            <div className="space-y-2">
              {rules.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <div className="text-sm text-gray-700">
                    <code className="text-xs bg-white px-1 rounded">{r.field}</code>{" "}
                    <span className="text-gray-500">{r.op}</span>{" "}
                    <code className="text-xs bg-white px-1 rounded">
                      {r.daysAgo !== undefined ? `${r.daysAgo} gün` : String(r.value)}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
        >
          Segmenti Kaydet
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {segments.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Henüz segment yok</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {segments.map((s) => (
              <div key={s.id} className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FilterIcon size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{s.name}</span>
                    {previewCount[s.id] !== undefined && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        {previewCount[s.id]} kişi
                      </span>
                    )}
                  </div>
                  <code className="text-xs text-gray-500 whitespace-pre-wrap break-all">
                    {s.rules}
                  </code>
                </div>
                <button
                  onClick={() => preview(s.id)}
                  title="Önizleme"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => remove(s.id)}
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
