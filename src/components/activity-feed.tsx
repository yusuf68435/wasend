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

const ICON_MAP = {
  message_in: { icon: MessageSquare, color: "bg-blue-50 text-blue-700", label: "Gelen" },
  message_out: { icon: MessageSquare, color: "bg-green-50 text-green-700", label: "Giden" },
  broadcast: { icon: Megaphone, color: "bg-orange-50 text-orange-700", label: "Toplu" },
  contact: { icon: UserPlus, color: "bg-cyan-50 text-cyan-700", label: "Yeni" },
  flow_trigger: { icon: Zap, color: "bg-yellow-50 text-yellow-700", label: "Akış" },
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
        <Activity size={16} /> Son Aktivite
      </h3>
      {items === null ? (
        <p className="text-sm text-gray-400">Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">Henüz aktivite yok</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((it, idx) => {
            const meta = ICON_MAP[it.type];
            const Icon = meta.icon;
            const content = (
              <div className="py-2.5 flex items-start gap-3">
                <span className={"p-1.5 rounded-lg flex-shrink-0 " + meta.color}>
                  <Icon size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {it.title}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatRelative(it.time)}
                    </span>
                  </div>
                  {it.detail && (
                    <p className="text-xs text-gray-500 truncate">{it.detail}</p>
                  )}
                </div>
              </div>
            );
            return it.href ? (
              <li key={idx}>
                <Link href={it.href} className="block hover:bg-gray-50 rounded -mx-2 px-2">
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
