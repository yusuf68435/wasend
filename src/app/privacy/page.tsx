import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "WaSend kişisel verilerin işlenmesi ve gizlilik politikası.",
};

export default function PrivacyPage() {
  const updated = "20 Nisan 2026";
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-green-600 text-sm hover:underline">
          ← Ana sayfa
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-2">
          Gizlilik Politikası
        </h1>
        <p className="text-sm text-gray-500 mb-12">Son güncelleme: {updated}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Veri sorumlusu</h2>
            <p>
              WaSend (&ldquo;Hizmet&rdquo;) bu politikada kişisel verilerinizi
              işlediği yöntem, amaç ve haklarınızı açıklar. 6698 sayılı Kişisel
              Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) ve AB Genel Veri
              Koruma Tüzüğü (&ldquo;GDPR&rdquo;) uyarınca hazırlanmıştır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Toplanan veriler</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Hesap bilgisi:</strong> ad, e-posta, işletme adı, şifre (bcrypt hashli).</li>
              <li><strong>WhatsApp API ayarları:</strong> Meta Business Phone Number ID.</li>
              <li><strong>Kontak verileri:</strong> kullanıcının eklediği müşteri adı, telefon, etiket, not.</li>
              <li><strong>Mesaj logları:</strong> gönderilen/alınan WhatsApp mesajlarının içeriği ve durumu.</li>
              <li><strong>Teknik log:</strong> IP adresi, kullanıcı aracısı, audit kayıtları.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. İşleme amacı ve hukuki dayanak</h2>
            <p>Verileriniz şu amaçlarla işlenir:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hizmet sağlama (sözleşme ifası — KVKK m.5/2.c, GDPR 6.1.b)</li>
              <li>Güvenlik, dolandırıcılık önleme (meşru menfaat — KVKK m.5/2.f, GDPR 6.1.f)</li>
              <li>Yasal yükümlülükler (fatura, mahkeme talepleri)</li>
              <li>Ürün iyileştirme (anonimleştirilmiş analitik)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Verilerin paylaşımı</h2>
            <p>
              Verileriniz yalnızca aşağıdaki üçüncü taraflarla işleme amacına
              bağlı olarak paylaşılır:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Meta Platforms (WhatsApp Cloud API):</strong> mesaj gönderimi</li>
              <li><strong>Anthropic:</strong> AI destekli otomatik cevap (opsiyonel, kullanıcı aktivasyonu gerekir)</li>
              <li><strong>Stripe / İyzico:</strong> ödeme (etkinleştirildiğinde)</li>
              <li><strong>Resend:</strong> sistem e-postaları (şifre sıfırlama vb.)</li>
              <li><strong>Hostinger VPS:</strong> barındırma (Frankfurt, AB lokasyonu)</li>
            </ul>
            <p>Üçüncü taraflara pazarlama amaçlı satış YAPILMAZ.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Saklama süresi</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Hesap aktif olduğu sürece tüm veriler korunur.</li>
              <li>Hesap silindiğinde 30 gün geri alma penceresi, sonra tam silinme.</li>
              <li>Yasal saklama süreleri (vergi, ticaret) bağlayıcı olabilir.</li>
              <li>Audit log&apos;ları 2 yıl saklanır.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Haklarınız</h2>
            <p>KVKK Madde 11 ve GDPR 15-22 uyarınca şu haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Verilerinize erişim ve kopyasını alma (Hesap → Verilerimi İndir)</li>
              <li>Düzeltme, güncelleme (Ayarlar üzerinden)</li>
              <li>Silme — hesabı silme hakkı (Hesap → Hesabımı Sil)</li>
              <li>İşlemeyi kısıtlama, itiraz etme</li>
              <li>Veri taşınabilirliği (JSON export)</li>
            </ul>
            <p>
              Haklarınızı kullanmak için uygulama içi araçları veya{" "}
              <a href="mailto:privacy@wasend.tech" className="text-green-600 underline">
                privacy@wasend.tech
              </a>{" "}
              adresini kullanabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Güvenlik önlemleri</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>TLS 1.2/1.3 tüm HTTP iletişiminde</li>
              <li>bcrypt cost 12 ile şifre hash</li>
              <li>Meta webhook HMAC SHA-256 imza doğrulama</li>
              <li>PostgreSQL scram-sha-256 kimlik doğrulama, localhost-only bağlantı</li>
              <li>UFW firewall, fail2ban brute-force koruması</li>
              <li>API key&apos;ler SHA-256 hash&apos;li saklanır</li>
              <li>Otomatik güvenlik güncellemeleri (unattended-upgrades)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Çerezler</h2>
            <p>
              Yalnızca zorunlu oturum çerezleri kullanılır (NextAuth JWT).
              Pazarlama veya analitik çerezi YOK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Değişiklikler</h2>
            <p>
              Bu politikanın güncellenmesi durumunda ana sayfada duyuru yapılır
              ve e-posta gönderilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. İletişim</h2>
            <p>
              Gizlilik ile ilgili soru ve talepler:{" "}
              <a href="mailto:privacy@wasend.tech" className="text-green-600 underline">
                privacy@wasend.tech
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 flex gap-4 text-sm text-gray-500">
          <Link href="/terms" className="text-green-600 hover:underline">
            Kullanım Şartları
          </Link>
          <Link href="/" className="hover:underline">
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
