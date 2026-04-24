import { requireAuth } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Bot,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [contactCount, messageCount, autoReplyCount, broadcastCount, userData] =
    await Promise.all([
      prisma.contact.count({ where: { userId: user.id } }),
      prisma.message.count({ where: { userId: user.id } }),
      prisma.autoReply.count({ where: { userId: user.id } }),
      prisma.broadcast.count({ where: { userId: user.id } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { phone: true, emailVerifiedAt: true },
      }),
    ]);

  const wabaConfigured = Boolean(userData?.phone && userData.phone.trim().length > 0);

  const stats: Array<{
    label: string;
    value: number;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    href: string;
  }> = [
    { label: "Kişiler", value: contactCount, icon: Users, href: "/dashboard/contacts" },
    { label: "Mesajlar", value: messageCount, icon: MessageSquare, href: "/dashboard/messages" },
    { label: "Otomatik Cevap", value: autoReplyCount, icon: Bot, href: "/dashboard/auto-replies" },
    { label: "Toplu Mesaj", value: broadcastCount, icon: Megaphone, href: "/dashboard/broadcasts" },
  ];

  return (
    <div className="max-w-[1200px]">
      <div className="mb-10">
        <h2 className="display-md text-[#1d1d1f]">
          Hoş geldin, {user.name?.split(" ")[0] || "kullanıcı"}
        </h2>
        <p className="text-[15px] text-[#6e6e73] mt-2 tracking-tight">
          İşte işletmenin WhatsApp özeti.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group bg-white rounded-3xl border border-[#d2d2d7] p-6 hover:border-[#1d1d1f]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-[#6e6e73] tracking-tight">{label}</p>
                <p className="text-[34px] font-semibold tracking-tight text-[#1d1d1f] mt-2 leading-none tabular-nums">
                  {value.toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] group-hover:bg-[#1d1d1f] group-hover:text-white transition-colors">
                <Icon size={18} strokeWidth={1.75} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-[#d2d2d7] p-8">
          <h3 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] mb-5">
            Hızlı Başlangıç
          </h3>
          <div className="space-y-1.5">
            <StepItem
              step={1}
              text="Ayarlardan WhatsApp bağlantını kur"
              done={wabaConfigured}
              href="/dashboard/settings"
            />
            <StepItem
              step={2}
              text="Kişiler sayfasından müşterilerini ekle"
              done={contactCount > 0}
              href="/dashboard/contacts"
            />
            <StepItem
              step={3}
              text="Otomatik cevap kuralları oluştur"
              done={autoReplyCount > 0}
              href="/dashboard/auto-replies"
            />
            <StepItem
              step={4}
              text="İlk toplu mesajını gönder"
              done={broadcastCount > 0}
              href="/dashboard/broadcasts"
            />
          </div>
        </div>

        <ActivityFeed />
      </div>

      {!wabaConfigured && (
        <div className="mt-6 bg-white border border-[#d2d2d7] rounded-3xl p-5 flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#ff9f0a]/10 text-[#ff9f0a] flex items-center justify-center text-[15px] font-semibold">
            !
          </div>
          <div className="flex-1">
            <h4 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
              WhatsApp bağlantısı henüz kurulmadı
            </h4>
            <p className="text-[13px] text-[#6e6e73] mt-1 tracking-tight leading-relaxed">
              Mesaj gönderebilmek için önce Meta Business hesabından Phone Number
              ID&apos;ni ekle. 5 dakikalık kurulum.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#1d1d1f] text-white px-4 py-2 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
          >
            Ayarlara git <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

function StepItem({
  step,
  text,
  done,
  href,
}: {
  step: number;
  text: string;
  done: boolean;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 tracking-tight ${
          done
            ? "bg-[#30d158]/15 text-[#30d158]"
            : "bg-[#f5f5f7] text-[#86868b]"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <p
        className={`text-[14px] flex-1 tracking-tight ${
          done ? "text-[#86868b] line-through" : "text-[#1d1d1f]"
        }`}
      >
        {text}
      </p>
      {!done && href && (
        <ArrowRight
          size={14}
          className="text-[#86868b] group-hover:text-[#1d1d1f] transition-colors"
        />
      )}
    </div>
  );

  if (!done && href) {
    return (
      <Link
        href={href}
        className="block hover:bg-[#f5f5f7] rounded-xl px-3 py-2.5 -mx-3 group transition-colors"
      >
        {content}
      </Link>
    );
  }
  return <div className="px-3 py-2.5">{content}</div>;
}
