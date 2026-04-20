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
} from "lucide-react";

const links = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Kiracılar", icon: Users },
  { href: "/admin/support", label: "Destek", icon: LifeBuoy },
  { href: "/admin/announcements", label: "Duyurular", icon: Megaphone },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/audit", label: "Denetim Kaydı", icon: ScrollText },
  { href: "/admin/system", label: "Sistem Sağlığı", icon: Cpu },
  { href: "/admin/security", label: "Güvenlik (2FA)", icon: Shield },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Admin menüsünü aç"
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-slate-900 text-slate-100 rounded-lg shadow-sm"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Menüyü kapat"
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <aside
        className={`fixed md:sticky md:top-0 top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-amber-400" />
                <h1 className="text-lg font-bold">WaSend Admin</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">Platform yönetimi</p>
              <p className="text-xs text-slate-500 mt-2 truncate">{adminName}</p>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Menüyü kapat"
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-amber-500/20 text-amber-200"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeftRight size={16} /> Kiracı paneline dön
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-red-500/20 hover:text-red-300 w-full"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
