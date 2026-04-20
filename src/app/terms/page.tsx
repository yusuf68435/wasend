import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "WaSend hizmet kullanım şartları.",
};

export default function TermsPage() {
  const updated = "20 Nisan 2026";
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-green-600 text-sm hover:underline">
          ← Ana sayfa
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-2">
          Kullanım Şartları
        </h1>
        <p className="text-sm text-gray-500 mb-12">Son güncelleme: {updated}</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Kabul</h2>
            <p>
              WaSend hizmetini kullanarak bu şartları kabul etmiş olursunuz.
              Kabul etmiyorsanız hizmeti kullanmayın.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Hizmet tanımı</h2>
            <p>
              WaSend, Meta WhatsApp Business Cloud API üzerinden otomatik
              mesajlaşma, randevu hatırlatma, toplu mesaj ve AI destekli müşteri
              hizmetleri araçları sağlayan bir SaaS platformudur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Kullanıcı yükümlülükleri</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>18 yaşından büyük olmak ve yasal kapasiteye sahip olmak.</li>
              <li>
                Yalnızca <strong>onay vermiş (opt-in)</strong> alıcılara mesaj
                göndermek. WhatsApp ve Meta&apos;nın{" "}
                <a
                  href="https://business.whatsapp.com/policy"
                  className="text-green-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Business Messaging Policy
                </a>
                &apos;sine uymak.
              </li>
              <li>Spam, dolandırıcılık, yasadışı içerik göndermemek.</li>
              <li>Platformu aşırı yükleyen otomasyon kurmamak.</li>
              <li>API key&apos;lerini güvende tutmak, ihlal durumunda derhal iptal etmek.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Yasaklı kullanım</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hedef müşterinin onayı olmadan pazarlama mesajı.</li>
              <li>Politik kampanyalar (Meta yasak kapsamında).</li>
              <li>
                Sahte kimlik, phishing, ilaç pazarlama, kumar (yerel yasalar
                uyarınca).
              </li>
              <li>Başka kullanıcıların verilerine izinsiz erişim.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Ücretlendirme</h2>
            <p>
              Plan ücretleri <Link href="/dashboard/billing" className="text-green-600 underline">faturalandırma sayfasında</Link>{" "}
              görünür. Aylık peşin fatura, iptal edene kadar yenilenir.
              Kullanım kotası aşılırsa plan yükseltmesi gerekir. WhatsApp
              conversation ücretleri (Meta fiyatlandırması) kullanıcıya ayrıca
              yansıyabilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Askıya alma / fesih</h2>
            <p>
              Aşağıdaki durumlarda hesabınız askıya alınabilir veya
              kapatılabilir:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Kullanım şartları ihlali</li>
              <li>Ödeme 7 gün gecikirse</li>
              <li>Meta tarafından WABA askıya alınırsa</li>
              <li>Yasal talep (mahkeme kararı vb.)</li>
            </ul>
            <p>
              Kendi hesabınızı{" "}
              <Link href="/dashboard/account" className="text-green-600 underline">
                Hesap
              </Link>{" "}
              sayfasından her zaman silebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Hizmet seviyesi</h2>
            <p>
              &ldquo;Best-effort&rdquo; uptime; resmi SLA yok. Planlı bakımlar
              önceden duyurulur. Hizmet kesintisinden doğan dolaylı zararlardan
              sorumluluk kabul edilmez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Fikri mülkiyet</h2>
            <p>
              Platform kodu, tasarımı ve markaları WaSend&apos;e aittir. Sizin
              eklediğiniz kontaklar, mesajlar, şablonlar size aittir; biz
              yalnızca işleme izni alırız.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Sorumluluk reddi</h2>
            <p>
              Hizmet &ldquo;olduğu gibi&rdquo; sağlanır. Mesaj iletiminin Meta
              tarafından reddi, geç teslimat, WABA askıya alınması gibi
              durumlardan biz sorumlu değiliz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Uyuşmazlık çözümü</h2>
            <p>
              Bu şartlar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklar
              İstanbul mahkemelerinde çözülür.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Değişiklik</h2>
            <p>
              Şartlarda değişiklik yapma hakkımız saklıdır. Önemli değişiklikler
              e-posta ile duyurulur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">12. İletişim</h2>
            <p>
              <a
                href="mailto:legal@wasend.tech"
                className="text-green-600 underline"
              >
                legal@wasend.tech
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 flex gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="text-green-600 hover:underline">
            Gizlilik Politikası
          </Link>
          <Link href="/" className="hover:underline">
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
