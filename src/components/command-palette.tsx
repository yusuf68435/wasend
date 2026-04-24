"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Users,
  Filter,
  Bot,
  Zap,
  FileText,
  Megaphone,
  Clock,
  Sparkles,
  BarChart3,
  UserPlus,
  Key,
  Webhook,
  CreditCard,
  Settings,
  UserCircle,
  Plus,
  LogOut,
  Shield,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ size?: number }>;
  keywords?: string[];
  action: () => void;
  group: string;
}

/**
 * Global command palette — Cmd+K (Mac) / Ctrl+K (Windows).
 * Sayfa navigasyonu + hızlı eylemler (yeni kontak, yeni broadcast vb.).
 */
export function CommandPalette({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  const items: CommandItem[] = [
    // Ana
    { id: "nav-dashboard", label: "Panel", icon: LayoutDashboard, group: "Gezinti", action: () => go("/dashboard") },
    { id: "nav-analytics", label: "Analitik", icon: BarChart3, group: "Gezinti", action: () => go("/dashboard/analytics") },
    { id: "nav-messages", label: "Mesajlar", icon: MessageSquare, group: "Gezinti", action: () => go("/dashboard/messages") },
    // Kitle & Otomasyon
    { id: "nav-contacts", label: "Kişiler", icon: Users, group: "Kitle & Otomasyon", action: () => go("/dashboard/contacts") },
    { id: "nav-segments", label: "Segmentler", icon: Filter, group: "Kitle & Otomasyon", action: () => go("/dashboard/segments") },
    { id: "nav-auto-replies", label: "Otomatik Cevap", icon: Bot, group: "Kitle & Otomasyon", action: () => go("/dashboard/auto-replies"), keywords: ["auto", "reply"] },
    { id: "nav-flows", label: "Akışlar", icon: Zap, group: "Kitle & Otomasyon", action: () => go("/dashboard/flows"), keywords: ["flow", "chatbot"] },
    { id: "nav-quick", label: "Hızlı Cevaplar", icon: Sparkles, group: "Kitle & Otomasyon", action: () => go("/dashboard/quick-replies") },
    { id: "nav-templates", label: "Şablonlar", icon: FileText, group: "Kitle & Otomasyon", action: () => go("/dashboard/templates"), keywords: ["template"] },
    // Gönderim
    { id: "nav-broadcasts", label: "Toplu Mesaj", icon: Megaphone, group: "Gönderim", action: () => go("/dashboard/broadcasts"), keywords: ["broadcast", "kampanya"] },
    { id: "nav-reminders", label: "Hatırlatmalar", icon: Clock, group: "Gönderim", action: () => go("/dashboard/reminders") },
    // Geliştirici
    { id: "nav-api-keys", label: "API Anahtarları", icon: Key, group: "Geliştirici", action: () => go("/dashboard/api-keys"), keywords: ["api", "key", "token"] },
    { id: "nav-webhooks", label: "Webhook'lar", icon: Webhook, group: "Geliştirici", action: () => go("/dashboard/webhooks") },
    // Profil
    { id: "nav-team", label: "Ekip", icon: UserPlus, group: "Profil", action: () => go("/dashboard/team"), keywords: ["team", "üye", "davet"] },
    { id: "nav-billing", label: "Faturalandırma", icon: CreditCard, group: "Profil", action: () => go("/dashboard/billing"), keywords: ["billing", "plan", "ödeme"] },
    { id: "nav-settings", label: "Ayarlar", icon: Settings, group: "Profil", action: () => go("/dashboard/settings") },
    { id: "nav-account", label: "Hesap", icon: UserCircle, group: "Profil", action: () => go("/dashboard/account") },
    // Hızlı eylemler
    {
      id: "action-new-contact",
      label: "Yeni kişi ekle",
      icon: Plus,
      group: "Hızlı Eylem",
      action: () => go("/dashboard/contacts"),
      keywords: ["add", "create", "new"],
    },
    {
      id: "action-new-broadcast",
      label: "Yeni toplu mesaj",
      icon: Plus,
      group: "Hızlı Eylem",
      action: () => go("/dashboard/broadcasts"),
    },
    {
      id: "action-new-flow",
      label: "Yeni akış oluştur",
      icon: Plus,
      group: "Hızlı Eylem",
      action: () => go("/dashboard/flows"),
    },
    // Çıkış
    {
      id: "action-logout",
      label: "Çıkış Yap",
      icon: LogOut,
      group: "Hesap",
      action: () => {
        setOpen(false);
        signOut({ callbackUrl: "/login" });
      },
      keywords: ["logout", "sign out"],
    },
  ];

  if (isSuperAdmin) {
    items.push({
      id: "nav-admin",
      label: "Admin Paneli",
      icon: Shield,
      group: "Yönetim",
      action: () => go("/admin"),
      keywords: ["admin", "tenant"],
    });
  }

  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Komut paleti"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 bg-black/40"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#d2d2d7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#d2d2d7] px-4 py-3">
          <Search size={16} className="text-[#86868b]" aria-hidden />
          <Command.Input
            placeholder="Ara veya bir eyleme git…"
            className="flex-1 bg-transparent outline-none text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] tracking-tight"
          />
          <kbd className="text-[11px] bg-[#f5f5f7] text-[#6e6e73] px-1.5 py-0.5 rounded border border-[#d2d2d7]">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-[13px] text-[#86868b] tracking-tight">
            Eşleşen bir şey bulunamadı
          </Command.Empty>
          {groups.map((group) => (
            <Command.Group
              key={group}
              heading={group}
              className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#86868b] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
            >
              {items
                .filter((i) => i.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${(item.keywords || []).join(" ")}`}
                      onSelect={item.action}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] text-[#1d1d1f] cursor-pointer tracking-tight data-[selected=true]:bg-[#f5f5f7] data-[selected=true]:text-[#1d1d1f]"
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Command.Item>
                  );
                })}
            </Command.Group>
          ))}
        </Command.List>
        <div className="border-t border-[#d2d2d7] px-4 py-2 text-[11px] text-[#6e6e73] flex items-center justify-between tracking-tight">
          <span>
            <kbd className="bg-[#f5f5f7] border border-[#d2d2d7] px-1.5 py-0.5 rounded">↑↓</kbd>{" "}
            gez{" "}
            <kbd className="bg-[#f5f5f7] border border-[#d2d2d7] px-1.5 py-0.5 rounded ml-2">↵</kbd>{" "}
            seç
          </span>
          <span>
            <kbd className="bg-[#f5f5f7] border border-[#d2d2d7] px-1.5 py-0.5 rounded">⌘K</kbd>{" "}
            aç/kapat
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
