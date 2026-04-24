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

// Apple HIG semantic system colors — nötr kart + accent ikon
const LEVEL_STYLE: Record<
  string,
  { iconBg: string; iconColor: string; icon: React.ReactNode }
> = {
  info: {
    iconBg: "bg-[#0071e3]/10",
    iconColor: "text-[#0071e3]",
    icon: <Info size={16} strokeWidth={1.75} />,
  },
  success: {
    iconBg: "bg-[#30d158]/15",
    iconColor: "text-[#30d158]",
    icon: <CheckCircle2 size={16} strokeWidth={1.75} />,
  },
  warning: {
    iconBg: "bg-[#ff9f0a]/10",
    iconColor: "text-[#ff9f0a]",
    icon: <AlertTriangle size={16} strokeWidth={1.75} />,
  },
  critical: {
    iconBg: "bg-[#ff453a]/10",
    iconColor: "text-[#ff453a]",
    icon: <AlertTriangle size={16} strokeWidth={1.75} />,
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
    <div className="mb-6 space-y-3">
      {items.map((a) => {
        const s = LEVEL_STYLE[a.level] || LEVEL_STYLE.info;
        return (
          <div
            key={a.id}
            className="rounded-2xl bg-white border border-[#d2d2d7] px-5 py-4 flex items-start gap-3"
          >
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${s.iconBg} ${s.iconColor}`}
            >
              {s.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold tracking-tight text-[14px] text-[#1d1d1f]">
                {a.title}
              </p>
              <p className="text-[13px] text-[#6e6e73] mt-0.5 whitespace-pre-wrap tracking-tight leading-relaxed">
                {a.content}
              </p>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition"
              title="Kapat"
              aria-label="Kapat"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
