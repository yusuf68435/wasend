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

/**
 * Admin sidebar — Apple HIG, dashboard sidebar ile aynı dil.
 * Tek fark: logo yerinde 'Admin' rozeti + `Shield` işareti, tenant paneline
 * dönüş shortcut'ı footer'da.
 */
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
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
    ],
  },
  {
    label: "Operasyon",
    items: [
      { href: "/admin/audit", label: "Denetim Kaydı", icon: ScrollText },
      { href: "/admin/system", label: "Sistem Sağlığı", icon: Cpu },
      { href: "/admin/security", label: "Güvenlik (2FA)", icon: Shield },
    ],
  },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  function renderLink({ href, label, icon: Icon }: NavItem) {
    const isActive =
      href === "/admin" ? pathname === href : pathname.startsWith(href);
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
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside
        className={`fixed md:sticky md:top-0 top-0 left-0 z-50 h-screen w-64 bg-[#fbfbfd] border-r border-[#d2d2d7] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-[#d2d2d7]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] inline-flex items-center gap-1.5">
                WaSend
                <span
                  aria-hidden
                  className="inline-flex items-center h-[18px] px-1.5 rounded-full bg-[#1d1d1f] text-white text-[10px] font-medium tracking-tight"
                >
                  Admin
                </span>
              </h1>
              <p className="text-[11px] text-[#86868b] mt-1 tracking-tight">
                Platform yönetimi
              </p>
              <p className="text-[11px] text-[#86868b] mt-2 truncate max-w-[180px]">
                {adminName}
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
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 py-1 text-[10px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
                {group.label}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {group.items.map(renderLink)}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#d2d2d7] space-y-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium tracking-tight text-[#6e6e73] hover:bg-[#f5f5f7]/60 hover:text-[#1d1d1f] transition"
          >
            <ArrowLeftRight size={16} strokeWidth={1.75} />
            Kiracı paneline dön
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium tracking-tight text-[#6e6e73] hover:bg-[#ff453a]/5 hover:text-[#ff453a] transition w-full"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
