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

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "WaSend",
      url: "https://wasend.tech",
      logo: "https://wasend.tech/logo.png",
      sameAs: [] as string[],
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@wasend.tech",
        contactType: "customer support",
        areaServed: "TR",
        availableLanguage: ["Turkish", "English"],
      },
    },
    {
      "@type": "Product",
      name: "WaSend — WhatsApp Business Otomasyonu",
      description:
        "Türkiye için WhatsApp Business otomasyon platformu. Otomatik cevap, randevu hatırlatma, toplu mesaj, AI chatbot ve analitik.",
      brand: { "@type": "Brand", name: "WaSend" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "TRY",
        lowPrice: "499",
        highPrice: "2999",
        offerCount: "3",
        offers: [
          {
            "@type": "Offer",
            name: "Başlangıç",
            price: "499",
            priceCurrency: "TRY",
            description: "500 kişi, 10 toplu mesaj/ay, 100K AI token",
            url: "https://wasend.tech/#pricing",
          },
          {
            "@type": "Offer",
            name: "Profesyonel",
            price: "1299",
            priceCurrency: "TRY",
            description: "5.000 kişi, 100 toplu mesaj/ay, 1M AI token, 5 ekip üyesi",
            url: "https://wasend.tech/#pricing",
          },
          {
            "@type": "Offer",
            name: "İşletme",
            price: "2999",
            priceCurrency: "TRY",
            description:
              "50.000 kişi, 1.000 toplu mesaj/ay, 10M AI token, API + Webhook, 7/24 destek",
            url: "https://wasend.tech/#pricing",
          },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "WhatsApp Business otomasyon yazılımı Türkiye'de ne kadar?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Türkiye pazarında WhatsApp Business otomasyon paketleri aylık 850–3.500 ₺ arasında değişir. WaSend paketleri 499 ₺, 1.299 ₺ ve 2.999 ₺/ay. Yıllık ödemede 2 ay bedava. KDV dahil.",
          },
        },
        {
          "@type": "Question",
          name: "Toplu WhatsApp mesaj göndermek için ekstra ücret öder miyim?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Platform ücreti dışında Meta WhatsApp Cloud API mesaj başına ücret alır: utility ~0,02 ₺, marketing ~0,08 ₺. Service konuşmaları ücretsizdir.",
          },
        },
        {
          "@type": "Question",
          name: "Kurulum için ne gerekli?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Meta Business hesabı ve onaylı WhatsApp Business numarası yeterli. Phone Number ID ve API token'ı paneline girersin, 5 dakikada hazır.",
          },
        },
        {
          "@type": "Question",
          name: "Ücretsiz deneme var mı?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "14 gün boyunca Profesyonel plan özellikleri açık. Kredi kartı istenmiyor.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-600">WaSend</h1>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Özellikler</a>
            <a href="#pricing" className="hover:text-gray-900">Fiyatlar</a>
            <a href="#faq" className="hover:text-gray-900">SSS</a>
            <Link href="/blog" className="hover:text-gray-900">Blog</Link>
            <Link href="/changelog" className="hover:text-gray-900">Yenilikler</Link>
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
          Kredi kartı gerekmez · 5 dakikada kurulur · İstediğiniz zaman iptal ·
          Paketler <strong className="text-gray-600">499 ₺&apos;den</strong> başlar (KDV dahil)
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
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Türkiye&apos;nin en şeffaf WhatsApp otomasyon fiyatları
            </h3>
            <p className="text-gray-500">
              499 ₺&apos;den başlar · KDV dahil · 14 gün ücretsiz deneme · Kredi kartı gerekmez
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PriceCard
              name="Başlangıç"
              price="499"
              annualPrice="4.790"
              tagline="Tek çalışan işletmeler · Kuaför, klinik, butik"
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
              price="1.299"
              annualPrice="12.470"
              tagline="Büyüyen KOBİ'ler · E-ticaret, restoran zincirleri"
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
              price="2.999"
              annualPrice="28.790"
              tagline="Yüksek hacim + entegrasyon · Kurumsal ekipler"
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

          {/* Rakip karşılaştırma — SEO için "whatsapp otomasyon fiyat karşılaştırma" */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
                💰 Fiyat karşılaştırması
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                Türkiye pazarında en uygun fiyat
              </h4>
              <p className="text-sm text-gray-500">
                Aynı özellik setinde rakiplerin aylık başlangıç fiyatları
              </p>
            </div>

            {/* Desktop: tablo · Mobil: kart listesi */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 text-xs uppercase tracking-wider font-medium">
                <div className="col-span-4 px-6 py-4">Platform</div>
                <div className="col-span-3 px-6 py-4 text-right">Başlangıç</div>
                <div className="col-span-3 px-6 py-4 text-right">Orta paket</div>
                <div className="col-span-2 px-6 py-4 text-right">Fark</div>
              </div>
              <CompareRow platform="WaSend" starter="499 ₺" mid="1.299 ₺" diff="—" highlighted />
              <CompareRow platform="Infoset" starter="880 ₺" mid="2.880 ₺" diff="+%76" />
              <CompareRow platform="DialogTab" starter="~850 ₺" mid="~1.700 ₺ + $49" diff="+%70" />
              <CompareRow platform="Yapaytech" starter="~1.750 ₺" mid="Özel teklif" diff="+%250" />
              <CompareRow platform="Wati" starter="~1.750 ₺" mid="~3.500 ₺" diff="+%250" />
            </div>

            {/* Mobil kart listesi */}
            <div className="md:hidden space-y-2">
              <CompareCard platform="WaSend" starter="499 ₺" mid="1.299 ₺" diff="—" highlighted />
              <CompareCard platform="Infoset" starter="880 ₺" mid="2.880 ₺" diff="+%76" />
              <CompareCard platform="DialogTab" starter="~850 ₺" mid="~1.700 ₺" diff="+%70" />
              <CompareCard platform="Yapaytech" starter="~1.750 ₺" mid="Özel teklif" diff="+%250" />
              <CompareCard platform="Wati" starter="~1.750 ₺" mid="~3.500 ₺" diff="+%250" />
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Fiyatlar Nisan 2026 · rakiplerin resmi sayfalarından alınmıştır · kur ve paket kapsamı değişebilir
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-10 max-w-2xl mx-auto">
            Tüm fiyatlar KDV dahildir. Yıllık ödemede <strong>2 ay bedava</strong>.
            Meta WhatsApp Business Cloud API conversation ücretleri Meta tarafından
            ayrıca fatura edilir (utility ~0,02 ₺, marketing ~0,08 ₺/mesaj); WaSend
            sadece platform ücretini tahsil eder.
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
                q: "WhatsApp Business otomasyon yazılımı Türkiye'de ne kadar?",
                a: "Türkiye pazarında WhatsApp Business otomasyon paketleri genellikle aylık 850 ₺ (giriş seviyesi) ile 3.500 ₺ (kurumsal) arasında değişir. WaSend Başlangıç 499 ₺, Profesyonel 1.299 ₺, İşletme 2.999 ₺/ay. Yıllık ödemede 2 ay bedava. Tüm fiyatlar KDV dahildir.",
              },
              {
                q: "Toplu WhatsApp mesaj göndermek için ekstra ücret öder miyim?",
                a: "Platform ücreti dışında Meta WhatsApp Cloud API mesaj başına ücret alır: utility (sipariş/randevu bildirimi) yaklaşık 0,02 ₺, marketing kategorisi ~0,08 ₺. Kullanıcı başlattığı service konuşmaları 1 Kasım 2024'ten itibaren ücretsizdir. WaSend bu ücretleri Meta'dan direkt fatura alır, aracı kâr eklemez.",
              },
              {
                q: "Kurulum için ne gerekli?",
                a: "Meta Business hesabı + onaylı WhatsApp Business numarası. WaSend panelinden Phone Number ID ve API token'ını gir, 5 dakika.",
              },
              {
                q: "Ücretsiz deneme sınırı var mı?",
                a: "14 gün boyunca tüm Profesyonel plan özellikleri açık. Mesaj ve kişi sınırları plan limitlerinin yarısı kadar. Deneme sonunda Başlangıç planına otomatik düşer ya da iptal edebilirsin.",
              },
              {
                q: "Neden Infoset, Wati veya DialogTab yerine WaSend?",
                a: "Aynı özellik seti (WhatsApp Cloud API + toplu mesaj + akış editörü + AI fallback) için ortalama %40–60 daha uygun. Tüm fiyatlar KDV dahil ve şeffaf — ekstra agent ücreti, kurulum bedeli ya da gizli maliyet yoktur. Türkiye lokalizasyonu, KVKK uyumu ve iyzico ile TL ödeme yerleşik.",
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

function CompareRow({
  platform,
  starter,
  mid,
  diff,
  highlighted,
}: {
  platform: string;
  starter: string;
  mid: string;
  diff: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-12 items-center text-sm border-t ${
        highlighted
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-100"
          : "border-gray-100 hover:bg-gray-50"
      } transition-colors`}
    >
      <div className="col-span-4 px-6 py-4 flex items-center gap-2">
        <span
          className={`font-semibold ${
            highlighted ? "text-green-700" : "text-gray-800"
          }`}
        >
          {platform}
        </span>
        {highlighted && (
          <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
            <Check size={10} /> Biz
          </span>
        )}
      </div>
      <div
        className={`col-span-3 px-6 py-4 text-right tabular-nums ${
          highlighted ? "font-bold text-gray-900" : "text-gray-700"
        }`}
      >
        {starter}
      </div>
      <div
        className={`col-span-3 px-6 py-4 text-right tabular-nums ${
          highlighted ? "font-bold text-gray-900" : "text-gray-700"
        }`}
      >
        {mid}
      </div>
      <div className="col-span-2 px-6 py-4 text-right">
        {highlighted ? (
          <span className="text-gray-400">—</span>
        ) : (
          <span className="inline-block text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
            {diff}
          </span>
        )}
      </div>
    </div>
  );
}

function CompareCard({
  platform,
  starter,
  mid,
  diff,
  highlighted,
}: {
  platform: string;
  starter: string;
  mid: string;
  diff: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlighted
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold ${
              highlighted ? "text-green-700" : "text-gray-800"
            }`}
          >
            {platform}
          </span>
          {highlighted && (
            <span className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
              <Check size={10} /> Biz
            </span>
          )}
        </div>
        {!highlighted && (
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
            {diff}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
            Başlangıç
          </p>
          <p
            className={`tabular-nums ${
              highlighted ? "font-bold text-gray-900" : "text-gray-700"
            }`}
          >
            {starter}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
            Orta paket
          </p>
          <p
            className={`tabular-nums ${
              highlighted ? "font-bold text-gray-900" : "text-gray-700"
            }`}
          >
            {mid}
          </p>
        </div>
      </div>
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
  annualPrice,
  tagline,
  features,
  popular,
}: {
  name: string;
  price: string;
  annualPrice?: string;
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
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">₺{price}</span>
          <span className="text-gray-400 text-sm">/ay</span>
        </div>
        {annualPrice && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              <Zap size={10} /> %17 yıllık indirim
            </span>
            <span className="text-xs text-gray-500">₺{annualPrice}/yıl</span>
          </div>
        )}
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
