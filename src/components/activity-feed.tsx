"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Megaphone,
  UserPlus,
  Zap,
  Activity,
} from "lucide-react";

interface ActivityItem {
  type: "message_in" | "message_out" | "broadcast" | "contact" | "flow_trigger";
  time: string;
  title: string;
  detail?: string;
  href?: string;
}

// Apple HIG: Monokrom ikon chip'leri. Type farkı ikonla anlatılır, renkle değil.
const ICON_MAP = {
  message_in: { icon: MessageSquare, label: "Gelen" },
  message_out: { icon: MessageSquare, label: "Giden" },
  broadcast: { icon: Megaphone, label: "Toplu" },
  contact: { icon: UserPlus, label: "Yeni" },
  flow_trigger: { icon: Zap, label: "Akış" },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "şimdi";
  if (min < 60) return `${min}dk`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}s`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}g`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/activity");
    if (res.ok) {
      const d = await res.json();
      setItems(d.items);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  return (
    <div className="bg-white rounded-3xl border border-[#d2d2d7] p-8">
      <h3 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] mb-5 inline-flex items-center gap-2">
        <Activity size={16} strokeWidth={1.75} /> Son Aktivite
      </h3>
      {items === null ? (
        <p className="text-[13px] text-[#86868b] tracking-tight">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-[#86868b] tracking-tight">
          Henüz aktivite yok
        </p>
      ) : (
        <ul className="divide-y divide-[#f5f5f7]">
          {items.map((it, idx) => {
            const meta = ICON_MAP[it.type];
            const Icon = meta.icon;
            const content = (
              <div className="py-3 flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl flex-shrink-0 bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center">
                  <Icon size={14} strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[14px] font-medium tracking-tight text-[#1d1d1f] truncate">
                      {it.title}
                    </p>
                    <span className="text-[11px] text-[#86868b] flex-shrink-0 tabular-nums">
                      {formatRelative(it.time)}
                    </span>
                  </div>
                  {it.detail && (
                    <p className="text-[12px] text-[#6e6e73] truncate tracking-tight mt-0.5">
                      {it.detail}
                    </p>
                  )}
                </div>
              </div>
            );
            return it.href ? (
              <li key={idx}>
                <Link
                  href={it.href}
                  className="block hover:bg-[#f5f5f7] rounded-xl -mx-3 px-3 transition-colors"
                >
                  {content}
                </Link>
              </li>
            ) : (
              <li key={idx}>{content}</li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
