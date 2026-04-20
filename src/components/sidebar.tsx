"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
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
  Sparkles,
  UserPlus,
  Key,
  Webhook,
  CreditCard,
  Shield,
  UserCircle,
  LifeBuoy,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

/**
 * 5 gruba bölünmüş sidebar — daha önce 17 flat link vardı, bilişsel yük fazlaydı.
 */
const GROUPS: NavGroup[] = [
  {
    label: "Ana",
    defaultOpen: true,
    items: [
      { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
      { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
      { href: "/dashboard/messages", label: "Mesajlar", icon: MessageSquare },
    ],
  },
  {
    label: "Kitle & Otomasyon",
    defaultOpen: true,
    items: [
      { href: "/dashboard/contacts", label: "Kişiler", icon: Users },
      { href: "/dashboard/segments", label: "Segmentler", icon: Filter },
      { href: "/dashboard/auto-replies", label: "Otomatik Cevap", icon: Bot },
      { href: "/dashboard/flows", label: "Akışlar", icon: Zap },
      { href: "/dashboard/quick-replies", label: "Hızlı Cevaplar", icon: Sparkles },
      { href: "/dashboard/templates", label: "Şablonlar", icon: FileText },
    ],
  },
  {
    label: "Gönderim",
    defaultOpen: true,
    items: [
      { href: "/dashboard/broadcasts", label: "Toplu Mesaj", icon: Megaphone },
      { href: "/dashboard/reminders", label: "Hatırlatmalar", icon: Clock },
    ],
  },
  {
    label: "Geliştirici",
    defaultOpen: true,
    items: [
      { href: "/dashboard/api-keys", label: "API Anahtarları", icon: Key },
      { href: "/dashboard/webhooks", label: "Webhook'lar", icon: Webhook },
    ],
  },
];

const PROFILE_ITEMS: NavItem[] = [
  { href: "/dashboard/team", label: "Ekip", icon: UserPlus },
  { href: "/dashboard/billing", label: "Faturalandırma", icon: CreditCard },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
  { href: "/dashboard/account", label: "Hesap", icon: UserCircle },
  { href: "/dashboard/support", label: "Destek", icon: LifeBuoy },
];

export function Sidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(GROUPS.filter((g) => g.defaultOpen).map((g) => g.label)),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Path değişince mobil menüyü kapat
  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function renderLink({ href, label, icon: Icon }: NavItem) {
    const isActive = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
          isActive
            ? "bg-green-50 text-green-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon size={16} />
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Menüyü aç"
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-700"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Menüyü kapat"
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside
        className={`fixed md:sticky md:top-0 top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-600">WaSend</h1>
            <p className="text-xs text-gray-400 mt-1">WhatsApp Otomasyon</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
            className="md:hidden text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <p className="hidden md:block text-xs text-gray-400 mt-3">
          <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">
            ⌘K
          </kbd>{" "}
          ile hızlı ara
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
        {GROUPS.map((group) => {
          const isOpen = openGroups.has(group.label);
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700"
                aria-expanded={isOpen}
                aria-controls={`group-${group.label}`}
              >
                <span>{group.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div id={`group-${group.label}`} className="mt-1 space-y-0.5">
                  {group.items.map(renderLink)}
                </div>
              )}
            </div>
          );
        })}

        {isSuperAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition bg-amber-50 text-amber-800 hover:bg-amber-100 mt-3"
          >
            <Shield size={16} />
            Admin Paneli
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200 space-y-0.5">
        <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Profil
        </p>
        {PROFILE_ITEMS.map(renderLink)}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-gray-500">Tema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition w-full"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
      </aside>
    </>
  );
}
