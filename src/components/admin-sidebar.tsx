"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Shield,
  LayoutDashboard,
  Users,
  Megaphone,
  ScrollText,
  Cpu,
  Flag,
  LifeBuoy,
  LogOut,
  ArrowLeftRight,
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
}

const GROUPS: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
      { href: "/admin/tenants", label: "Kiracılar", icon: Users },
      { href: "/admin/support", label: "Destek", icon: LifeBuoy },
    ],
  },
  {
    label: "Yapı",
    items: [
      { href: "/admin/announcements", label: "Duyurular", icon: Megaphone },
      { href: "/admin/feature-flags", label: "Flags", icon: Flag },
    ],
  },
  {
    label: "Operasyon",
    items: [
      { href: "/admin/audit", label: "Denetim", icon: ScrollText },
      { href: "/admin/system", label: "Sistem", icon: Cpu },
      { href: "/admin/security", label: "Güvenlik", icon: Shield },
    ],
  },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  function isLinkActive(href: string): boolean {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  // Desktop: tek sütun liste satırı, compact h-8
  function renderDesktopLink({ href, label, icon: Icon }: NavItem) {
    const isActive = isLinkActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-[13px] font-medium tracking-tight transition ${
          isActive
            ? "bg-[#f5f5f7] text-[#1d1d1f]"
            : "text-[#6e6e73] hover:bg-[#f5f5f7]/60 hover:text-[#1d1d1f]"
        }`}
      >
        <Icon size={15} strokeWidth={1.75} />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  // Mobile tile: dikey ikon + metin
  function renderMobileTile({ href, label, icon: Icon }: NavItem) {
    const isActive = isLinkActive(href);
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
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Admin menüsünü aç"
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-white/90 backdrop-blur-xl rounded-xl border border-[#d2d2d7] shadow-sm text-[#1d1d1f]"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Menüyü kapat"
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        />
      )}

      {/* ============ MOBILE SHEET ============ */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-[100dvh] w-full max-w-sm bg-[#fbfbfd] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#d2d2d7]">
          <h1 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f] inline-flex items-center gap-1.5">
            WaSend
            <span
              aria-hidden
              className="inline-flex items-center h-[18px] px-1.5 rounded-full bg-[#1d1d1f] text-white text-[10px] font-medium tracking-tight"
            >
              Admin
            </span>
          </h1>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

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

          <p className="px-1 pt-2 text-[11px] text-[#86868b] tracking-tight truncate">
            {adminName}
          </p>
        </div>

        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 border-t border-[#d2d2d7] flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#d2d2d7] text-[12px] font-medium tracking-tight text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
          >
            <ArrowLeftRight size={14} strokeWidth={1.75} />
            Kiracı paneli
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-[12px] font-medium tracking-tight text-[#ff453a] hover:bg-[#ff453a]/10 transition"
          >
            <LogOut size={14} strokeWidth={1.75} />
            Çıkış
          </button>
        </div>
      </aside>

      {/* ============ DESKTOP ============ */}
      <aside className="hidden md:sticky md:top-0 md:flex md:flex-col h-screen w-64 bg-[#fbfbfd] border-r border-[#d2d2d7]">
        <div className="px-4 pt-4 pb-3 border-b border-[#d2d2d7]">
          <h1 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] inline-flex items-center gap-1.5">
            WaSend
            <span
              aria-hidden
              className="inline-flex items-center h-[18px] px-1.5 rounded-full bg-[#1d1d1f] text-white text-[10px] font-medium tracking-tight"
            >
              Admin
            </span>
          </h1>
          <p className="text-[11px] text-[#86868b] mt-1.5 truncate max-w-[200px]">
            {adminName}
          </p>
        </div>

        <nav className="flex-1 min-h-0 px-2 py-2 space-y-2 overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 py-0.5 text-[10px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                {group.label}
              </p>
              <div className="mt-0.5 space-y-0.5">
                {group.items.map(renderDesktopLink)}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-[#d2d2d7] flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border border-[#d2d2d7] text-[11.5px] font-medium tracking-tight text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
          >
            <ArrowLeftRight size={12} strokeWidth={1.75} />
            Kiracı paneli
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11.5px] font-medium tracking-tight text-[#6e6e73] hover:bg-[#ff453a]/10 hover:text-[#ff453a] transition"
          >
            <LogOut size={12} strokeWidth={1.75} />
            Çıkış
          </button>
        </div>
      </aside>
    </>
  );
}
