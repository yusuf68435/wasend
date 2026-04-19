"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save, Plus, ArrowLeft } from "lucide-react";

interface FlowRecord {
  id: string;
  name: string;
  trigger: string;
  triggerValue: string | null;
  isActive: boolean;
  nodes: string;
}

type NodeDataType =
  | "start"
  | "message"
  | "question"
  | "condition"
  | "action"
  | "handoff"
  | "end";

interface NodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeDataType;
  text?: string;
  prompt?: string;
  varName?: string;
  cond?: string;
  value?: string;
  addTags?: string;
  mediaUrl?: string;
  mediaType?: string;
}

const NODE_LABELS: Record<NodeDataType, string> = {
  start: "Başlangıç",
  message: "Mesaj",
  question: "Soru",
  condition: "Koşul",
  action: "Eylem",
  handoff: "İnsana Aktar",
  end: "Bitir",
};

const NODE_COLORS: Record<NodeDataType, string> = {
  start: "bg-green-100 border-green-400 text-green-800",
  message: "bg-blue-100 border-blue-400 text-blue-800",
  question: "bg-purple-100 border-purple-400 text-purple-800",
  condition: "bg-yellow-100 border-yellow-400 text-yellow-800",
  action: "bg-teal-100 border-teal-400 text-teal-800",
  handoff: "bg-red-100 border-red-400 text-red-800",
  end: "bg-gray-100 border-gray-400 text-gray-700",
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function scatterPosition(index: number) {
  return {
    x: 260 + ((index * 37) % 240),
    y: 240 + ((index * 53) % 160),
  };
}

export default function FlowEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [flow, setFlow] = useState<FlowRecord | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch("/api/flows")
      .then((r) => (r.ok ? r.json() : []))
      .then((flows: FlowRecord[]) => {
        const found = flows.find((f) => f.id === id);
        if (!found) return;
        setFlow(found);
        try {
          const graph = JSON.parse(found.nodes);
          const rfNodes: Node<NodeData>[] = graph.nodes.map(
            (n: {
              id: string;
              type: NodeDataType;
              data: Record<string, unknown>;
              position?: { x: number; y: number };
            }, i: number) => ({
              id: n.id,
              type: "default",
              position: n.position || { x: 200 + (i % 4) * 200, y: 100 + Math.floor(i / 4) * 120 },
              data: {
                label: NODE_LABELS[n.type] || n.type,
                nodeType: n.type,
                ...n.data,
              },
              className: `px-3 py-2 rounded-lg border-2 ${NODE_COLORS[n.type]} text-xs font-medium min-w-[120px] text-center`,
            }),
          );
          const rfEdges: Edge[] = [];
          for (const n of graph.nodes) {
            if (n.next) {
              rfEdges.push({
                id: `${n.id}->${n.next}`,
                source: n.id,
                target: n.next,
              });
            }
            if (Array.isArray(n.branches)) {
              for (const b of n.branches) {
                rfEdges.push({
                  id: `${n.id}-${b.label}->${b.next}`,
                  source: n.id,
                  target: b.next,
                  label: b.label,
                });
              }
            }
          }
          setNodes(rfNodes);
          setEdges(rfEdges);
        } catch (e) {
          console.error("Graph parse error:", e);
        }
      });
  }, [id, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  function addNode(type: NodeDataType) {
    const newId = makeId(type);
    const n: Node<NodeData> = {
      id: newId,
      type: "default",
      position: scatterPosition(nodes.length),
      data: {
        label: NODE_LABELS[type],
        nodeType: type,
        ...(type === "message" ? { text: "Yeni mesaj" } : {}),
        ...(type === "question" ? { prompt: "Sorunuz?", varName: "" } : {}),
        ...(type === "condition" ? { cond: "contains", value: "" } : {}),
        ...(type === "action" ? { addTags: "" } : {}),
      },
      className: `px-3 py-2 rounded-lg border-2 ${NODE_COLORS[type]} text-xs font-medium min-w-[120px] text-center`,
    };
    setNodes((nds) => [...nds, n]);
  }

  function updateNodeData(nodeId: string, patch: Partial<NodeData>) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } as NodeData } : n,
      ),
    );
  }

  function serialize() {
    // Determine start node: first node of type "start", else first node
    const startNode =
      nodes.find((n) => n.data.nodeType === "start") || nodes[0];
    if (!startNode) return null;

    const graphNodes = nodes.map((n) => {
      const outgoing = edges.filter((e) => e.source === n.id);
      const next = outgoing.length > 0 && !outgoing[0].label ? outgoing[0].target : null;
      const branches = outgoing
        .filter((e) => e.label)
        .map((e) => ({
          label: String(e.label),
          cond: (n.data.cond as string) || "contains",
          value: String(e.label),
          next: e.target,
        }));

      const { label: _label, nodeType, ...rest } = n.data;
      void _label;
      const base: Record<string, unknown> = { ...rest };
      delete base.label;
      delete base.nodeType;

      return {
        id: n.id,
        type: nodeType,
        position: n.position,
        data: base,
        next,
        ...(branches.length > 0 ? { branches } : {}),
      };
    });

    return {
      startId: startNode.id,
      nodes: graphNodes,
    };
  }

  async function save() {
    if (!flow) return;
    const graph = serialize();
    if (!graph) {
      setInfo("Grafik boş");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/flows", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: flow.id,
        nodes: JSON.stringify(graph),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setInfo(data.error || "Kaydedilemedi");
      return;
    }
    setInfo("Kaydedildi");
    setTimeout(() => setInfo(null), 2000);
  }

  const selected = nodes.find((n) => n.id === selectedId);

  if (!flow) {
    return <div className="text-gray-400 p-8">Yükleniyor...</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/flows")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{flow.name}</h2>
            <p className="text-xs text-gray-500">
              {flow.trigger === "keyword"
                ? `Anahtar: ${flow.triggerValue}`
                : "Yeni kontakta"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {info && <span className="text-sm text-green-600">{info}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[180px_1fr_280px] gap-4 min-h-0">
        <aside className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 overflow-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Düğüm Paleti
          </p>
          {(
            ["message", "question", "condition", "action", "handoff", "end"] as NodeDataType[]
          ).map((t) => (
            <button
              key={t}
              onClick={() => addNode(t)}
              className={`w-full text-left px-3 py-2 rounded-lg border ${NODE_COLORS[t]} text-xs font-medium inline-flex items-center gap-2`}
            >
              <Plus size={12} /> {NODE_LABELS[t]}
            </button>
          ))}
          <p className="text-xs text-gray-400 mt-4 leading-snug">
            Bağlamak için bir düğümün kenarındaki daireden diğerine sürükleyin.
            Koşul düğümleri için kenar etiketlerine eşleşme değerini yazın.
          </p>
        </aside>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        <aside className="bg-white border border-gray-200 rounded-xl p-4 overflow-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Özellikler
          </p>
          {!selected ? (
            <p className="text-sm text-gray-400">
              Düzenlemek için bir düğüm seçin.
            </p>
          ) : (
            <NodeInspector
              key={selected.id}
              node={selected}
              onUpdate={(patch) => updateNodeData(selected.id, patch)}
              onDelete={() => {
                setNodes((nds) => nds.filter((x) => x.id !== selected.id));
                setEdges((eds) =>
                  eds.filter((e) => e.source !== selected.id && e.target !== selected.id),
                );
                setSelectedId(null);
              }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function NodeInspector({
  node,
  onUpdate,
  onDelete,
}: {
  node: Node<NodeData>;
  onUpdate: (patch: Partial<NodeData>) => void;
  onDelete: () => void;
}) {
  const t = node.data.nodeType;
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">
        Tür: <span className="font-medium text-gray-700">{NODE_LABELS[t]}</span>
      </div>

      {t === "message" && (
        <TextArea
          label="Metin"
          value={node.data.text || ""}
          onChange={(v) => onUpdate({ text: v })}
        />
      )}

      {t === "question" && (
        <>
          <TextArea
            label="Soru Metni"
            value={node.data.prompt || ""}
            onChange={(v) => onUpdate({ prompt: v })}
          />
          <TextInput
            label="Cevap Değişken Adı (opsiyonel)"
            value={node.data.varName || ""}
            onChange={(v) => onUpdate({ varName: v })}
            placeholder="isim, tarih, vb."
          />
        </>
      )}

      {t === "condition" && (
        <>
          <p className="text-xs text-gray-500">
            Çıkış bağlantısı etiketine beklenen cevabı yazın. Varsayılan
            (else) dalı için etiketsiz bağlantı kullanın.
          </p>
          <Select
            label="Eşleme Türü"
            value={node.data.cond || "contains"}
            options={[
              { label: "İçerir", value: "contains" },
              { label: "Eşittir", value: "equals" },
              { label: "İle Başlar", value: "startsWith" },
              { label: "Regex", value: "regex" },
            ]}
            onChange={(v) => onUpdate({ cond: v })}
          />
        </>
      )}

      {t === "action" && (
        <TextInput
          label="Eklenecek Etiketler (virgülle)"
          value={node.data.addTags || ""}
          onChange={(v) => onUpdate({ addTags: v })}
          placeholder="vip, ilgilenen"
        />
      )}

      {t === "handoff" && (
        <p className="text-xs text-red-600">
          Bu noktada akış durur ve kontak &quot;needs-human&quot; etiketi
          alır.
        </p>
      )}

      {t === "end" && (
        <p className="text-xs text-gray-500">
          Bu düğüm akışı sonlandırır.
        </p>
      )}

      {t !== "start" && (
        <button
          onClick={onDelete}
          className="w-full text-red-600 text-sm py-2 border border-red-200 rounded-lg hover:bg-red-50"
        >
          Düğümü Sil
        </button>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
