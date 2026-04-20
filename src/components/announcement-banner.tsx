"use client";

import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  level: string;
  createdAt: string;
}

const LEVEL_STYLE: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    icon: <Info size={16} className="text-blue-600" />,
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    icon: <CheckCircle2 size={16} className="text-green-600" />,
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-900",
    icon: <AlertTriangle size={16} className="text-yellow-600" />,
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    icon: <AlertTriangle size={16} className="text-red-600" />,
  },
};

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((d) => setItems(d.announcements));
  }, []);

  async function dismiss(id: string) {
    setItems((cur) => cur.filter((i) => i.id !== id));
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {items.map((a) => {
        const s = LEVEL_STYLE[a.level] || LEVEL_STYLE.info;
        return (
          <div
            key={a.id}
            className={`rounded-lg border ${s.bg} ${s.border} ${s.text} px-4 py-3 flex items-start gap-3`}
          >
            <div className="flex-shrink-0 mt-0.5">{s.icon}</div>
            <div className="flex-1">
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-sm mt-0.5 whitespace-pre-wrap opacity-90">
                {a.content}
              </p>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              className="text-current opacity-60 hover:opacity-100"
              title="Kapat"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
