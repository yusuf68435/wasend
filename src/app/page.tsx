import Link from "next/link";
import {
  Bot,
  Calendar,
  Megaphone,
  Sparkles,
  BarChart3,
  Shield,
  Plug,
  ArrowRight,
  Check,
  Plus,
} from "lucide-react";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "WaSend",
      url: "https://wasend.tech",
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
            description:
              "5.000 kişi, 100 toplu mesaj/ay, 1M AI token, 5 ekip üyesi",
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
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />

      {/* NAV — Apple tarzı: transparan, ince, ortalanmış */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#fbfbfd]/80 border-b border-black/5">
        <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between text-[13px]">
          <Link
            href="/"
            className="font-semibold tracking-tight text-[15px] inline-flex items-center gap-1.5"
          >
            WaSend
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366]"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[#1d1d1f]/80">
            <a href="#features" className="hover:text-[#1d1d1f] transition-colors">
              Özellikler
            </a>
            <a href="#pricing" className="hover:text-[#1d1d1f] transition-colors">
              Fiyatlar
            </a>
            <a href="#faq" className="hover:text-[#1d1d1f] transition-colors">
              SSS
            </a>
            <Link href="/blog" className="hover:text-[#1d1d1f] transition-colors">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full text-[13px] font-medium hover:bg-black transition-colors"
            >
              Başla
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — büyük display type, merkezi, nefes alan */}
      <section className="pt-24 pb-32 md:pt-32 md:pb-40 px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <p className="eyebrow text-[#6e6e73] mb-6">
            WhatsApp Business Cloud API · Türkiye
          </p>
          <h1 className="display-xl mb-6">
            WhatsApp&apos;ı,
            <br />
            <span className="text-[#6e6e73] font-medium">akıllı işle.</span>
          </h1>
          <p className="text-[21px] md:text-[24px] leading-[1.3] text-[#6e6e73] max-w-[680px] mx-auto font-normal">
            Otomatik cevap, randevu hatırlatma, toplu mesaj, AI chatbot ve
            analitik. Hepsi tek bir sessiz panelde.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 bg-[#1d1d1f] text-white px-6 py-3 rounded-full text-[17px] font-medium hover:bg-black transition-all"
            >
              14 gün ücretsiz başla
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-1 text-[17px] text-[#1d1d1f] hover:underline underline-offset-4 px-2 py-3"
            >
              Daha fazlasını gör
              <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-[13px] text-[#6e6e73] mt-6">
            499 ₺/ay&apos;dan başlar · KDV dahil · Kredi kartı gerekmez
          </p>
        </div>

        {/* Hero görseli yerine rafine istatistik satırı */}
        <div className="max-w-[980px] mx-auto mt-20 grid grid-cols-3 gap-4 md:gap-12">
          <HeroStat value="%98" label="Otomatik cevap hızı" />
          <HeroStat value="7/24" label="Müşteri hizmeti" />
          <HeroStat value="KVKK" label="Uyumlu altyapı" />
        </div>
      </section>

      {/* PROBLEM / SOLUTION — Apple tarzı koyu "shelf" */}
      <section className="bg-[#1d1d1f] text-white py-32 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="max-w-[720px] mb-16">
            <p className="eyebrow text-[#86868b] mb-4">Neden WaSend</p>
            <h2 className="display-lg mb-6">
              Her gün aynı mesajı <br />
              yazmaktan yoruldunuz.
            </h2>
            <p className="text-[21px] leading-[1.35] text-[#86868b]">
              Randevu hatırlatması için alarm kuruyor, fiyat sorularına 3. kez
              aynı cevabı yazıyor, toplu duyuruları 50 kişiye tek tek
              gönderiyorsunuz. WaSend bunları bir kerede devralır.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <BeforeAfterCard
              before="Sabah 8:00 — tek tek hatırlatma"
              after="Bir gün önce 18:00'da otomatik"
            />
            <BeforeAfterCard
              before="Aynı fiyat sorusuna üçüncü cevap"
              after="Anahtar kelime → anında cevap"
            />
            <BeforeAfterCard
              before="200 kişiye tek tek duyuru"
              after="Tek tıkla gönder, rate limit biz"
            />
          </div>
        </div>
      </section>

      {/* FEATURES — büyük kartlar, Apple iPhone feature sayfası */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center mb-20">
            <p className="eyebrow text-[#6e6e73] mb-4">Özellikler</p>
            <h2 className="display-lg">
              İşletmenizin WhatsApp&apos;taki <br />
              tüm derdi, tek panelde.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Bot}
              title="Otomatik Cevap"
              desc="Anahtar kelime kuralları + Claude AI fallback. Gelen her mesaj 2 saniye içinde cevaplanır."
              large
            />
            <FeatureCard
              icon={Calendar}
              title="Randevu Hatırlatma"
              desc="Timezone-aware zamanlanmış mesajlar. Gelmeyen müşteri derdini unutun."
              large
            />
            <FeatureCard
              icon={Megaphone}
              title="Toplu Mesaj"
              desc="Segment bazlı kampanya, opt-out yönetimi, dakika başı rate limit otomatik."
            />
            <FeatureCard
              icon={Sparkles}
              title="Görsel Akış Editörü"
              desc="Sürükle-bırak chatbot akışları. Koşul, aksiyon, insan devretme."
            />
            <FeatureCard
              icon={BarChart3}
              title="Canlı Analitik"
              desc="Mesaj teslim oranı, tetiklenen kurallar, müşteri büyümesi."
            />
            <FeatureCard
              icon={Shield}
              title="KVKK + GDPR"
              desc="Otomatik opt-out, veri dışa aktarımı, hesap silme — tek tık."
            />
            <FeatureCard
              icon={Plug}
              title="Public API + Webhook"
              desc="CRM'inize bağlayın. HMAC-imzalı event'ler, 10+ tetikleyici."
              large
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — tek büyük alıntı vurgulu */}
      <section className="py-32 px-6 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center mb-16">
            <p className="eyebrow text-[#6e6e73] mb-4">Müşteriler</p>
            <h2 className="display-lg">Türkiye&apos;den işletme sahipleri.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Quote
              quote="Randevularımın %30'u gelmiyordu. WaSend'le bir gün önce otomatik hatırlatma gönderiyorum, artık neredeyse herkes geliyor."
              name="Elif K."
              role="Kuaför Salonu"
              city="İstanbul"
            />
            <Quote
              quote="'Sipariş hazır' mesajı için 2 kişi tutuyorduk. Şimdi broadcast ile 10 saniyede halloluyor."
              name="Murat S."
              role="Restoran"
              city="Ankara"
            />
            <Quote
              quote="Fiyat soruları anında cevaplanıyor. WhatsApp'tan günde 4 saat kazandım."
              name="Dr. Ayşe T."
              role="Klinik"
              city="İzmir"
            />
          </div>
        </div>
      </section>

      {/* PRICING — Apple Pay tarzı temiz kartlar */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center mb-20">
            <p className="eyebrow text-[#6e6e73] mb-4">Fiyatlandırma</p>
            <h2 className="display-lg mb-4">
              Basit, şeffaf, <br />
              yıllık ödemede iki ay bedava.
            </h2>
            <p className="text-[19px] text-[#6e6e73]">
              14 gün ücretsiz deneme · Kredi kartı gerekmez · KDV dahil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCard
              name="Başlangıç"
              tagline="Tek çalışan işletmeler"
              price="499"
              annualPrice="4.790"
              features={[
                "500 kişi",
                "10 toplu mesaj/ay",
                "100K AI token/ay",
                "3 otomasyon akışı",
                "Email destek",
              ]}
            />
            <PricingCard
              name="Profesyonel"
              tagline="Büyüyen KOBİ'ler"
              price="1.299"
              annualPrice="12.470"
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
            <PricingCard
              name="İşletme"
              tagline="Kurumsal ekipler"
              price="2.999"
              annualPrice="28.790"
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

          <p className="text-center text-[13px] text-[#6e6e73] mt-10 max-w-[640px] mx-auto leading-relaxed">
            Meta WhatsApp Cloud API konuşma ücretleri ayrıca Meta tarafından
            fatura edilir (utility ~0,02 ₺, marketing ~0,08 ₺/mesaj). WaSend
            yalnızca platform ücretini tahsil eder.
          </p>
        </div>
      </section>

      {/* FAQ — Apple-style accordion */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-[820px] mx-auto">
          <div className="text-center mb-16">
            <p className="eyebrow text-[#6e6e73] mb-4">SSS</p>
            <h2 className="display-lg">Sıkça sorulanlar.</h2>
          </div>
          <div className="border-t border-[#d2d2d7]">
            {FAQ_ITEMS.map((f) => (
              <FAQItem key={f.q} question={f.q} answer={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Apple end-of-page büyük CTA */}
      <section className="py-32 px-6 bg-[#1d1d1f] text-white">
        <div className="max-w-[820px] mx-auto text-center">
          <h2 className="display-lg mb-6">
            Bugün başla. <br />
            Yarın zaman kazan.
          </h2>
          <p className="text-[21px] text-[#86868b] mb-10 max-w-[540px] mx-auto">
            5 dakikalık kurulum. Kredi kartı istenmez. İstediğiniz zaman iptal.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-[#1d1d1f] px-7 py-3.5 rounded-full text-[17px] font-medium hover:bg-[#f5f5f7] transition-colors"
          >
            14 gün ücretsiz dene
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER — Apple tarzı: ince, küçük, gri */}
      <footer className="bg-[#f5f5f7] text-[#6e6e73] text-[12px] py-10 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-[#d2d2d7]">
            <div>
              <h5 className="font-semibold text-[#1d1d1f] mb-3 text-[13px]">
                Ürün
              </h5>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:underline">
                    Özellikler
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:underline">
                    Fiyatlar
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:underline">
                    SSS
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-[#1d1d1f] mb-3 text-[13px]">
                Kaynaklar
              </h5>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog" className="hover:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:underline">
                    Yenilikler
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:underline">
                    Sistem durumu
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-[#1d1d1f] mb-3 text-[13px]">
                Yasal
              </h5>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:underline">
                    Gizlilik
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:underline">
                    Kullanım şartları
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-[#1d1d1f] mb-3 text-[13px]">
                İletişim
              </h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="mailto:support@wasend.tech"
                    className="hover:underline"
                  >
                    support@wasend.tech
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:privacy@wasend.tech"
                    className="hover:underline"
                  >
                    privacy@wasend.tech
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="pt-6">
            &copy; 2026 WaSend. Türkiye&apos;nin WhatsApp Business otomasyon
            platformu.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Alt component'ler ──────────────────────────────────────── */

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[28px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
        {value}
      </div>
      <div className="text-[13px] text-[#6e6e73] mt-1">{label}</div>
    </div>
  );
}

function BeforeAfterCard({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  return (
    <div className="bg-[#2c2c2e] rounded-2xl p-6">
      <p className="text-[13px] text-[#86868b] line-through mb-2">{before}</p>
      <p className="text-[15px] text-white flex items-start gap-2">
        <Check size={16} className="text-[#30d158] mt-0.5 flex-shrink-0" />
        <span>{after}</span>
      </p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  large,
}: {
  icon: typeof Bot;
  title: string;
  desc: string;
  large?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow ${
        large ? "md:col-span-2" : ""
      }`}
    >
      <div className="w-11 h-11 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-6">
        <Icon size={22} className="text-[#1d1d1f]" strokeWidth={1.75} />
      </div>
      <h3 className="display-md mb-3">{title}</h3>
      <p className="text-[17px] text-[#6e6e73] leading-[1.45]">{desc}</p>
    </div>
  );
}

function Quote({
  quote,
  name,
  role,
  city,
}: {
  quote: string;
  name: string;
  role: string;
  city: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col">
      <p className="text-[17px] leading-[1.5] text-[#1d1d1f] flex-1">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-6 pt-6 border-t border-[#d2d2d7]">
        <p className="text-[15px] font-medium text-[#1d1d1f]">{name}</p>
        <p className="text-[13px] text-[#6e6e73]">
          {role} · {city}
        </p>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  tagline,
  price,
  annualPrice,
  features,
  popular,
}: {
  name: string;
  tagline: string;
  price: string;
  annualPrice: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl p-8 md:p-10 flex flex-col ${
        popular
          ? "bg-[#1d1d1f] text-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
          : "bg-white text-[#1d1d1f] shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          En popüler
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-[22px] font-semibold tracking-tight">{name}</h3>
        <p
          className={`text-[13px] mt-0.5 ${
            popular ? "text-[#86868b]" : "text-[#6e6e73]"
          }`}
        >
          {tagline}
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-[48px] font-semibold tracking-tight leading-none">
            ₺{price}
          </span>
          <span
            className={`text-[15px] ${popular ? "text-[#86868b]" : "text-[#6e6e73]"}`}
          >
            /ay
          </span>
        </div>
        <p
          className={`text-[13px] mt-2 ${
            popular ? "text-[#86868b]" : "text-[#6e6e73]"
          }`}
        >
          Yıllık ₺{annualPrice} &middot;{" "}
          <span className={popular ? "text-[#30d158]" : "text-[#1d1d1f] font-medium"}>
            2 ay bedava
          </span>
        </p>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-[15px] leading-[1.4]"
          >
            <Check
              size={16}
              className={`mt-0.5 flex-shrink-0 ${
                popular ? "text-[#30d158]" : "text-[#1d1d1f]"
              }`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`text-center py-3 rounded-full text-[15px] font-medium transition-colors ${
          popular
            ? "bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]"
            : "bg-[#1d1d1f] text-white hover:bg-black"
        }`}
      >
        Ücretsiz başla
      </Link>
    </div>
  );
}

const FAQ_ITEMS = [
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
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-[#d2d2d7] py-6">
      <summary className="flex items-start justify-between gap-6 cursor-pointer list-none">
        <span className="text-[19px] font-medium text-[#1d1d1f] leading-[1.35]">
          {question}
        </span>
        <Plus
          size={20}
          className="text-[#6e6e73] flex-shrink-0 mt-1 transition-transform duration-300 group-open:rotate-45"
        />
      </summary>
      <p className="text-[17px] text-[#6e6e73] leading-[1.5] mt-4 pr-8">
        {answer}
      </p>
    </details>
  );
}
