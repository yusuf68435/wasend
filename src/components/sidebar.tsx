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
  Search,
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
        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium tracking-tight transition ${
          isActive
            ? "bg-[#f5f5f7] text-[#1d1d1f]"
            : "text-[#6e6e73] hover:bg-[#f5f5f7]/60 hover:text-[#1d1d1f]"
        }`}
      >
        <Icon size={16} strokeWidth={1.75} />
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
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-white/90 backdrop-blur-xl rounded-xl border border-[#d2d2d7] shadow-sm text-[#1d1d1f]"
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
        className={`fixed md:sticky md:top-0 top-0 left-0 z-50 h-screen w-64 bg-[#fbfbfd] border-r border-[#d2d2d7] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      <div className="p-5 border-b border-[#d2d2d7]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] inline-flex items-center gap-1.5">
              WaSend
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366]"
              />
            </h1>
            <p className="text-[11px] text-[#86868b] mt-1 tracking-tight">
              WhatsApp Otomasyon
            </p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
            className="md:hidden text-[#86868b] hover:text-[#1d1d1f]"
          >
            <X size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            // cmdk tetikle — command-palette.tsx document.addEventListener("keydown") dinliyor
            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                ctrlKey: true,
                bubbles: true,
              }),
            );
          }}
          className="mt-4 w-full hidden md:inline-flex items-center gap-2 h-8 px-2.5 bg-white border border-[#d2d2d7] rounded-full text-[12px] text-[#86868b] hover:border-[#1d1d1f]/20 transition"
          aria-label="Komut paleti"
        >
          <Search size={13} strokeWidth={2} />
          <span className="tracking-tight">Hızlı ara</span>
          <span className="ml-auto inline-flex items-center gap-0.5">
            <kbd className="px-1 py-0 rounded bg-[#f5f5f7] text-[#6e6e73] text-[10px] font-sans tracking-tight">
              ⌘K
            </kbd>
          </span>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {GROUPS.map((group) => {
          const isOpen = openGroups.has(group.label);
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-[#86868b] uppercase tracking-[0.08em] hover:text-[#1d1d1f]"
                aria-expanded={isOpen}
                aria-controls={`group-${group.label}`}
              >
                <span>{group.label}</span>
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {isOpen && (
                <div id={`group-${group.label}`} className="mt-1.5 space-y-0.5">
                  {group.items.map(renderLink)}
                </div>
              )}
            </div>
          );
        })}

        {isSuperAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium tracking-tight transition bg-[#1d1d1f] text-white hover:bg-black mt-4"
          >
            <Shield size={16} strokeWidth={1.75} />
            Admin Paneli
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-[#d2d2d7]">
        <p className="px-2 py-1 text-[10px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
          Profil
        </p>
        <div className="space-y-0.5">{PROFILE_ITEMS.map(renderLink)}</div>
        <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-[#f5f5f7]/50">
          <span className="text-[12px] text-[#6e6e73] tracking-tight font-medium">
            Tema
          </span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium tracking-tight text-[#6e6e73] hover:bg-[#ff453a]/5 hover:text-[#ff453a] transition w-full"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Çıkış Yap
        </button>
      </div>
      </aside>
    </>
  );
}
