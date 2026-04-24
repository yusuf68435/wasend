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
 * Mobilde: full-screen sheet, 2 sütunlu tile grid, kaydırmasız — tüm nav tek
 * ekranda. Desktop'ta: tek sütunlu klasik liste, collapse chevron'lar aktif.
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
      { href: "/dashboard/quick-replies", label: "Hızlı", icon: Sparkles },
      { href: "/dashboard/templates", label: "Şablonlar", icon: FileText },
    ],
  },
  {
    label: "Gönderim",
    defaultOpen: true,
    items: [
      { href: "/dashboard/broadcasts", label: "Toplu Mesaj", icon: Megaphone },
      { href: "/dashboard/reminders", label: "Hatırlatma", icon: Clock },
    ],
  },
  {
    label: "Geliştirici",
    defaultOpen: true,
    items: [
      { href: "/dashboard/api-keys", label: "API", icon: Key },
      { href: "/dashboard/webhooks", label: "Webhook", icon: Webhook },
    ],
  },
];

const PROFILE_ITEMS: NavItem[] = [
  { href: "/dashboard/team", label: "Ekip", icon: UserPlus },
  { href: "/dashboard/billing", label: "Fatura", icon: CreditCard },
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

  // Mobil menü açıkken body scroll kilitle
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  // Desktop link — tek sütun, ikon + metin satır
  function renderDesktopLink({ href, label, icon: Icon }: NavItem) {
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

  // Mobil tile — dikey ikon + metin, 2-col grid içinde
  function renderMobileTile({ href, label, icon: Icon }: NavItem) {
    const isActive = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`flex flex-col items-start gap-2 p-3 rounded-2xl border transition ${
          isActive
            ? "bg-[#1d1d1f] border-[#1d1d1f] text-white"
            : "bg-white border-[#d2d2d7] text-[#1d1d1f] hover:border-[#1d1d1f]/30 active:scale-[0.98]"
        }`}
      >
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
            isActive ? "bg-white/15 text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
          }`}
        >
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <span className="text-[12px] font-medium tracking-tight leading-tight">
          {label}
        </span>
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
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        />
      )}

      {/* ============ MOBILE FULL-SCREEN SHEET ============
          Tek ekranda tüm nav: kaydırma yok. */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-[100dvh] w-full max-w-sm bg-[#fbfbfd] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Compact header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#d2d2d7]">
          <h1 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f] inline-flex items-center gap-1.5">
            WaSend
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366]"
            />
          </h1>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Nav content — flex-1 + overflow-hidden, tüm içerik fit olsun */}
        <div className="flex-1 min-h-0 overflow-hidden px-4 pt-3 pb-3 flex flex-col gap-3">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-1 pb-1.5 text-[10px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map(renderMobileTile)}
              </div>
            </div>
          ))}

          {isSuperAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-[13px] font-medium tracking-tight hover:bg-black transition"
            >
              <Shield size={16} strokeWidth={1.75} />
              Admin Paneli
            </Link>
          )}

          <div className="mt-auto pt-3 border-t border-[#d2d2d7]">
            <p className="px-1 pb-1.5 text-[10px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
              Profil
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {PROFILE_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium tracking-tight transition ${
                      isActive
                        ? "bg-[#f5f5f7] text-[#1d1d1f]"
                        : "text-[#6e6e73] hover:bg-[#f5f5f7]/60 hover:text-[#1d1d1f]"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    <span className="leading-none">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar: tema + logout tek satır */}
        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 border-t border-[#d2d2d7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#86868b] tracking-tight">
              Tema
            </span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium tracking-tight text-[#ff453a] hover:bg-[#ff453a]/10 transition"
          >
            <LogOut size={14} strokeWidth={1.75} />
            Çıkış
          </button>
        </div>
      </aside>

      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className="hidden md:sticky md:top-0 md:flex md:flex-col h-screen w-64 bg-[#fbfbfd] border-r border-[#d2d2d7]">
        <div className="p-5 border-b border-[#d2d2d7]">
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
          <button
            type="button"
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  ctrlKey: true,
                  bubbles: true,
                }),
              );
            }}
            className="mt-4 w-full inline-flex items-center gap-2 h-8 px-2.5 bg-white border border-[#d2d2d7] rounded-full text-[12px] text-[#86868b] hover:border-[#1d1d1f]/20 transition"
            aria-label="Komut paleti"
          >
            <Search size={13} strokeWidth={2} />
            <span className="tracking-tight">Hızlı ara</span>
            <span className="ml-auto">
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
                  {isOpen ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={`group-${group.label}`}
                    className="mt-1.5 space-y-0.5"
                  >
                    {group.items.map(renderDesktopLink)}
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
          <div className="space-y-0.5">
            {PROFILE_ITEMS.map(renderDesktopLink)}
          </div>
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
