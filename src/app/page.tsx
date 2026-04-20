import Link from "next/link";
import {
  MessageSquare,
  Bot,
  Clock,
  Megaphone,
  ArrowRight,
  Check,
  Zap,
  Shield,
  BarChart3,
  Quote,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">WaSend</h1>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Özellikler</a>
            <a href="#pricing" className="hover:text-gray-900">Fiyatlar</a>
            <a href="#faq" className="hover:text-gray-900">SSS</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🟢 WhatsApp Business Cloud API Partner
        </div>
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
          Müşteri mesajlarına cevap vermekten{" "}
          <span className="text-green-600">yoruldunuz mu?</span>
        </h2>
        <p className="text-lg text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed">
          WaSend sayesinde randevu hatırlatmaları, sıkça sorulanlara cevaplar ve
          toplu kampanyalar otomatik gönderilir. Siz işinize odaklanın, biz
          WhatsApp&apos;ı halledelim.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            14 Gün Ücretsiz Başla <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="text-gray-600 hover:text-gray-900 px-6 py-3 text-sm font-medium"
          >
            Nasıl çalıştığını gör →
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Kredi kartı gerekmez · 5 dakikada kurulur · İstediğiniz zaman iptal
        </p>

        {/* Trust numbers */}
        <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
          <TrustBadge value="%98" label="Otomatik cevap hızı" />
          <TrustBadge value="7/24" label="Müşteri hizmeti" />
          <TrustBadge value="KVKK" label="Uyumlu altyapı" />
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Her gün 100+ mesaja cevap yazıyorsunuz
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Randevu hatırlatmak için alarm kuruyorsunuz. Sıkça sorulanlara
                3. kez aynı cevabı yazıyorsunuz. Toplu duyuruları 50 kişiye tek
                tek gönderiyorsunuz.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Bu zaman <strong className="text-white">asıl işinize ayırmalı</strong>.
                WaSend bunu halleder.
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 space-y-3">
              <SolutionItem
                before="Sabah 8:00 — randevu hatırlatma SMS'leri"
                after="Otomatik, bir gün önce 18:00'da"
              />
              <SolutionItem
                before="3 saniyede bir fiyat sorusu cevabı"
                after="Anahtar kelime → otomatik cevap"
              />
              <SolutionItem
                before="Kampanya için 200 kişiye tek tek mesaj"
                after="Tek tıkla 200'e gönder, rate limit kontrolü biz"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">
              İşletmenizin ihtiyacı olan her şey
            </h3>
            <p className="text-gray-500 mt-3">
              WhatsApp Cloud API üzerine kurulmuş, 12 katmanlı güvenlik ve
              ölçeklenebilir altyapı.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Bot,
                title: "Otomatik Cevap",
                desc: "Anahtar kelime bazlı kurallar + AI fallback (Claude). 7/24 müşteri hizmeti.",
              },
              {
                icon: Clock,
                title: "Randevu Hatırlatma",
                desc: "Zamanlanmış mesajlar, timezone aware. Gelmiyen müşteri derdini unutun.",
              },
              {
                icon: Megaphone,
                title: "Toplu Mesaj",
                desc: "Segment bazlı kampanya. Opt-out yönetimi, dakika başı rate limit otomatik.",
              },
              {
                icon: Zap,
                title: "Görsel Akış Editörü",
                desc: "Sürükle-bırak chatbot akışları. Koşul, aksiyon, insan devretme.",
              },
              {
                icon: BarChart3,
                title: "Canlı Analitik",
                desc: "Mesaj teslim oranı, en çok tetiklenen kurallar, müşteri büyümesi.",
              },
              {
                icon: MessageSquare,
                title: "CSV İçe Aktarım",
                desc: "10.000 kişiye kadar tek dosyayla içe aktar. Duplikasyon kontrolü dahil.",
              },
              {
                icon: Shield,
                title: "KVKK + GDPR Uyumlu",
                desc: "Otomatik opt-out, veri dışa aktarımı, hesap silme — tek tıkla.",
              },
              {
                icon: Check,
                title: "Public API + Webhook",
                desc: "CRM'inize bağlayın. HMAC-imzalı event'ler, 10+ tetikleyici.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                  <Icon size={20} className="text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Türkiye&apos;den işletme sahipleri ne diyor?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Testimonial
              quote="Randevularımın %30'u gelmiyordu. WaSend ile bir gün önce otomatik hatırlatma gönderiyorum, artık neredeyse herkes geliyor."
              name="Elif K."
              role="Kuaför salonu · İstanbul"
            />
            <Testimonial
              quote="Müşterilere 'sipariş hazır' mesajı göndermek için 2 kişi tutuyorduk. Şimdi broadcast ile 10 saniyede halloluyor."
              name="Murat S."
              role="Restoran · Ankara"
            />
            <Testimonial
              quote="Fiyat soruları artık anında cevaplanıyor. WhatsApp'tan günde 4 saat tasarruf ediyorum, o süre randevuları yöneteceğime bakıyorum."
              name="Dr. Ayşe T."
              role="Klinik · İzmir"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Basit fiyatlandırma</h3>
            <p className="text-gray-500">14 gün ücretsiz deneme · Kredi kartı gerekmez</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PriceCard
              name="Başlangıç"
              price="299"
              tagline="Tek çalışan işletmeler"
              features={[
                "500 kişi",
                "10 toplu mesaj/ay",
                "100K AI token/ay",
                "3 otomasyon akışı",
                "Email destek",
              ]}
            />
            <PriceCard
              name="Profesyonel"
              price="599"
              tagline="Büyüyen KOBİ'ler için"
              popular
              features={[
                "5.000 kişi",
                "100 toplu mesaj/ay",
                "1M AI token/ay",
                "20 otomasyon akışı",
                "5 ekip üyesi",
                "Öncelikli destek",
              ]}
            />
            <PriceCard
              name="İşletme"
              price="999"
              tagline="Yüksek hacim + entegrasyon"
              features={[
                "50.000 kişi",
                "1.000 toplu mesaj/ay",
                "10M AI token/ay",
                "200 otomasyon akışı",
                "25 ekip üyesi",
                "Public API + Webhook",
                "7/24 destek",
              ]}
            />
          </div>

          <p className="text-center text-xs text-gray-400 mt-8 max-w-2xl mx-auto">
            Meta WhatsApp Business Cloud API conversation ücretleri Meta
            tarafından ayrıca fatura edilir. WaSend sadece platform ücretini
            tahsil eder.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Sıkça sorulanlar
          </h3>
          <div className="space-y-4">
            {[
              {
                q: "Kurulum için ne gerekli?",
                a: "Meta Business hesabı + onaylı WhatsApp Business numarası. WaSend panelinden Phone Number ID ve API token'ını gir, 5 dakika.",
              },
              {
                q: "Ücretsiz deneme sınırı var mı?",
                a: "14 gün boyunca tüm Profesyonel plan özellikleri açık. Mesaj ve kişi sınırları plan limitlerinin yarısı kadar. Deneme sonunda Başlangıç planına otomatik düşer ya da iptal edebilirsin.",
              },
              {
                q: "Müşteri onayı olmadan mesaj atabilir miyim?",
                a: "Hayır. WhatsApp Business Policy ve KVKK gereği sadece onay vermiş (opt-in) kişilere mesaj atılabilir. Platform otomatik opt-out yönetimi (dur/stop/iptal) sağlar.",
              },
              {
                q: "Verilerim güvende mi?",
                a: "Evet. Frankfurt lokasyonlu VPS'te (AB sınırları içinde), scram-sha-256 kimlik doğrulama, günlük otomatik yedek, KVKK tam uyum. /privacy sayfasında detay.",
              },
              {
                q: "İptal etmek kolay mı?",
                a: "Ayarlar → Hesap → Hesabımı Sil. Bir tık. 30 gün veri saklanır, sonra otomatik silinir.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="bg-white border border-gray-200 rounded-xl p-5 group"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <ArrowRight
                    size={16}
                    className="text-gray-400 transition-transform group-open:rotate-90"
                  />
                </summary>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Bugün başla, yarın zaman kazan
          </h3>
          <p className="text-green-100 mb-8 text-lg">
            5 dakikalık kurulum. Kredi kartı yok. İstediğin zaman iptal.
          </p>
          <Link
            href="/register"
            className="bg-white text-green-700 px-8 py-3 rounded-lg font-medium hover:bg-green-50 inline-flex items-center gap-2"
          >
            14 Gün Ücretsiz Dene <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 text-sm text-gray-500 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-lg font-bold text-green-600 mb-2">WaSend</h4>
            <p className="text-xs text-gray-400">
              WhatsApp Business otomasyonu için Türkiye&apos;nin modern platformu.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Ürün</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-gray-900">Özellikler</a></li>
              <li><a href="#pricing" className="hover:text-gray-900">Fiyatlar</a></li>
              <li><a href="#faq" className="hover:text-gray-900">SSS</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Yasal</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-gray-900">Gizlilik Politikası</Link></li>
              <li><Link href="/terms" className="hover:text-gray-900">Kullanım Şartları</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">İletişim</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:support@wasend.tech" className="hover:text-gray-900">
                  support@wasend.tech
                </a>
              </li>
              <li>
                <a href="mailto:privacy@wasend.tech" className="hover:text-gray-900">
                  privacy@wasend.tech
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-10">
          &copy; 2026 WaSend. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}

function TrustBadge({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function SolutionItem({ before, after }: { before: string; after: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 line-through">{before}</p>
      <p className="text-sm text-green-400 flex items-center gap-2 mt-0.5">
        <Check size={14} /> {after}
      </p>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <Quote size={24} className="text-green-500 mb-3" />
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{quote}</p>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  tagline,
  features,
  popular,
}: {
  name: string;
  price: string;
  tagline?: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 border ${
        popular
          ? "border-green-500 ring-2 ring-green-100 shadow-lg"
          : "border-gray-200"
      } bg-white relative`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          En popüler
        </span>
      )}
      <h4 className="font-semibold text-gray-900 mb-1">{name}</h4>
      {tagline && <p className="text-xs text-gray-400 mb-4">{tagline}</p>}
      <div className="mb-5">
        <span className="text-4xl font-bold text-gray-900">₺{price}</span>
        <span className="text-gray-400 text-sm ml-1">/ay</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>{f}</span>
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
        Ücretsiz Başla
      </Link>
    </div>
  );
}
