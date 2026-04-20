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
    icon: React.ComponentType<{ size?: number }>;
    color: string;
    href: string;
  }> = [
    { label: "Kişiler", value: contactCount, icon: Users, color: "bg-blue-50 text-blue-600", href: "/dashboard/contacts" },
    { label: "Mesajlar", value: messageCount, icon: MessageSquare, color: "bg-green-50 text-green-600", href: "/dashboard/messages" },
    { label: "Otomatik Cevap", value: autoReplyCount, icon: Bot, color: "bg-purple-50 text-purple-600", href: "/dashboard/auto-replies" },
    { label: "Toplu Mesaj", value: broadcastCount, icon: Megaphone, color: "bg-orange-50 text-orange-600", href: "/dashboard/broadcasts" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Hoş geldin, {user.name?.split(" ")[0] || "kullanıcı"}
        </h2>
        <p className="text-gray-500 mt-1">İşte işletmenin WhatsApp özeti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString("tr-TR")}</p>
              </div>
              <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Hızlı Başlangıç</h3>
        <div className="space-y-3">
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

      {!wabaConfigured && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 text-sm">
              WhatsApp bağlantısı henüz kurulmadı
            </h4>
            <p className="text-sm text-amber-800 mt-1">
              Mesaj gönderebilmek için önce Meta Business hesabından Phone Number ID&apos;ni
              ekle. 5 dakikalık kurulum.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex-shrink-0 inline-flex items-center gap-1 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-700"
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
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <p className={`text-sm flex-1 ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>
        {text}
      </p>
      {!done && href && (
        <ArrowRight size={16} className="text-gray-400 group-hover:text-green-600" />
      )}
    </div>
  );

  if (!done && href) {
    return (
      <Link href={href} className="block hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 group">
        {content}
      </Link>
    );
  }
  return <div className="px-2 py-1.5">{content}</div>;
}
