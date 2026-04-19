"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Megaphone,
  Clock,
  Settings,
  LogOut,
  FileText,
  Filter,
  BarChart3,
  Zap,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/dashboard/messages", label: "Mesajlar", icon: MessageSquare },
  { href: "/dashboard/contacts", label: "Kişiler", icon: Users },
  { href: "/dashboard/segments", label: "Segmentler", icon: Filter },
  { href: "/dashboard/auto-replies", label: "Otomatik Cevap", icon: Bot },
  { href: "/dashboard/flows", label: "Akışlar", icon: Zap },
  { href: "/dashboard/templates", label: "Şablonlar", icon: FileText },
  { href: "/dashboard/broadcasts", label: "Toplu Mesaj", icon: Megaphone },
  { href: "/dashboard/reminders", label: "Hatırlatmalar", icon: Clock },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-green-600">WaSend</h1>
        <p className="text-xs text-gray-400 mt-1">WhatsApp Otomasyon</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition w-full"
        >
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
