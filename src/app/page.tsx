import Link from "next/link";
import { MessageSquare, Bot, Clock, Megaphone, ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">WaSend</h1>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Giriş Yap
            </Link>
            <Link href="/register" className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              Ücretsiz Dene
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          WhatsApp Business Otomasyon Platformu
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          Müşterilerinize <span className="text-green-600">7/24</span> otomatik
          WhatsApp mesajı gönderin
        </h2>
        <p className="text-lg text-gray-500 mt-6 max-w-2xl mx-auto">
          Randevu hatırlatma, otomatik cevap, toplu mesaj gönderimi.
          Küçük işletmeler için tasarlandı. 5 dakikada kurulur.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/register" className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition inline-flex items-center gap-2">
            Ücretsiz Başla <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            İşletmenizi büyütecek özellikler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Bot,
                title: "Otomatik Cevap",
                desc: "Müşteri mesajlarına anında otomatik yanıt. Mesai saatleri dışında bile.",
              },
              {
                icon: Clock,
                title: "Randevu Hatırlatma",
                desc: "Randevu saatinden önce otomatik hatırlatma mesajı gönderin.",
              },
              {
                icon: Megaphone,
                title: "Toplu Mesaj",
                desc: "Kampanya ve duyurularınızı tüm müşterilerinize tek seferde iletin.",
              },
              {
                icon: MessageSquare,
                title: "Mesaj Geçmişi",
                desc: "Tüm WhatsApp yazışmalarınızı tek panelden takip edin.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} className="text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Fiyatlandırma</h3>
          <p className="text-center text-gray-500 mb-12">Her bütçeye uygun planlar</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PriceCard
              name="Başlangıç"
              price="299"
              features={["500 mesaj/ay", "50 kişi", "Otomatik cevap", "Email destek"]}
            />
            <PriceCard
              name="Profesyonel"
              price="599"
              popular
              features={["2.000 mesaj/ay", "500 kişi", "Otomatik cevap", "Toplu mesaj", "Randevu hatırlatma", "Öncelikli destek"]}
            />
            <PriceCard
              name="İşletme"
              price="999"
              features={["10.000 mesaj/ay", "Sınırsız kişi", "Tüm özellikler", "API erişimi", "Özel entegrasyon", "7/24 destek"]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Hemen başlayın, ilk 14 gün ücretsiz
          </h3>
          <p className="text-green-100 mb-8">
            Kredi kartı gerekmez. 5 dakikada kurulur.
          </p>
          <Link href="/register" className="bg-white text-green-700 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition inline-flex items-center gap-2">
            Ücretsiz Dene <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          &copy; 2026 WaSend. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}

function PriceCard({
  name,
  price,
  features,
  popular,
}: {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div className={`rounded-xl p-6 border ${popular ? "border-green-500 ring-2 ring-green-100" : "border-gray-200"} bg-white relative`}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          Popüler
        </span>
      )}
      <h4 className="font-semibold text-gray-900 mb-1">{name}</h4>
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">₺{price}</span>
        <span className="text-gray-400 text-sm">/ay</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
            <Check size={16} className="text-green-500 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`block text-center py-2.5 rounded-lg font-medium transition ${
          popular
            ? "bg-green-600 text-white hover:bg-green-700"
            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        Başla
      </Link>
    </div>
  );
}
