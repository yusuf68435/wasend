import { requireAuth } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { MessageSquare, Users, Bot, Megaphone } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [contactCount, messageCount, autoReplyCount, broadcastCount] =
    await Promise.all([
      prisma.contact.count({ where: { userId: user.id } }),
      prisma.message.count({ where: { userId: user.id } }),
      prisma.autoReply.count({ where: { userId: user.id } }),
      prisma.broadcast.count({ where: { userId: user.id } }),
    ]);

  const stats = [
    { label: "Kişiler", value: contactCount, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Mesajlar", value: messageCount, icon: MessageSquare, color: "bg-green-50 text-green-600" },
    { label: "Otomatik Cevap", value: autoReplyCount, icon: Bot, color: "bg-purple-50 text-purple-600" },
    { label: "Toplu Mesaj", value: broadcastCount, icon: Megaphone, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Hoş geldin, {user.name?.split(" ")[0]}
        </h2>
        <p className="text-gray-500 mt-1">İşte işletmenin WhatsApp özeti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Hızlı Başlangıç</h3>
        <div className="space-y-3">
          <StepItem step={1} text="Kişiler sayfasından müşterilerini ekle" done={contactCount > 0} />
          <StepItem step={2} text="Otomatik cevap kuralları oluştur" done={autoReplyCount > 0} />
          <StepItem step={3} text="Ayarlardan WhatsApp bağlantını kur" done={false} />
          <StepItem step={4} text="İlk toplu mesajını gönder" done={broadcastCount > 0} />
        </div>
      </div>
    </div>
  );
}

function StepItem({ step, text, done }: { step: number; text: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <p className={`text-sm ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>{text}</p>
    </div>
  );
}
