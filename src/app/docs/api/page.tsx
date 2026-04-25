import Link from "next/link";
import {
  Code,
  Key,
  Send,
  Users,
  GitBranch,
  AlertTriangle,
  Shield,
  Gauge,
} from "lucide-react";
import CopyBlock from "./copy-block";

export const metadata = {
  title: "API Dokümantasyonu — WaSend",
  description: "WaSend Public API v1 — Bearer token, scope-based access, rate limit ve curl örnekleri.",
};

const BASE = "https://wasend.tech";

const SCOPES: Array<{ name: "read" | "send" | "write"; desc: string; tone: string }> = [
  {
    name: "read",
    desc: "GET endpoint'leri (kişi listesi vs.)",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    name: "send",
    desc: "Mesaj gönderimi, flow tetikleme",
    tone: "bg-green-50 text-green-700 border-green-200",
  },
  {
    name: "write",
    desc: "Kişi oluşturma / güncelleme",
    tone: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  scope: "read" | "send" | "write";
  desc: string;
  curl: string;
  response: string;
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  Mesajlar: [
    {
      method: "POST",
      path: "/api/v1/messages/send",
      scope: "send",
      desc: "Tek bir kişiye WhatsApp mesajı gönderir. mediaType + mediaUrl verilirse görsel/video/dosya olarak gider.",
      curl: `curl -X POST ${BASE}/api/v1/messages/send \\
  -H "Authorization: Bearer ws_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+905551234567",
    "message": "Merhaba! 👋"
  }'`,
      response: `{
  "id": "cmd_01...",
  "waMessageId": "wamid.HBg...",
  "status": "sent"
}`,
    },
  ],
  Kişiler: [
    {
      method: "GET",
      path: "/api/v1/contacts",
      scope: "read",
      desc: "Kişi listesini döndürür. limit (default 50, max 200) ve cursor (önceki sayfanın son id'si) ile sayfalanır.",
      curl: `curl ${BASE}/api/v1/contacts?limit=50 \\
  -H "Authorization: Bearer ws_live_xxxxx"`,
      response: `{
  "contacts": [
    { "id": "...", "phone": "+905551234567", "name": "...", "tags": "vip,beta" }
  ],
  "nextCursor": "cmd_xyz"
}`,
    },
    {
      method: "POST",
      path: "/api/v1/contacts",
      scope: "write",
      desc: "Yeni kişi oluşturur. phone unique — aynı numara ikinci kez 409 döner.",
      curl: `curl -X POST ${BASE}/api/v1/contacts \\
  -H "Authorization: Bearer ws_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+905551234567",
    "name": "Ali Veli",
    "tags": "yeni-müşteri"
  }'`,
      response: `{
  "id": "cmd_01...",
  "phone": "+905551234567",
  "name": "Ali Veli",
  ...
}`,
    },
  ],
  Akışlar: [
    {
      method: "POST",
      path: "/api/v1/flows/trigger",
      scope: "send",
      desc: "Bir kişi için flow başlatır (FlowSession oluşturur). Aktif olmayan flow veya opt-out kişi 403 döner.",
      curl: `curl -X POST ${BASE}/api/v1/flows/trigger \\
  -H "Authorization: Bearer ws_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flowId": "flow_01...",
    "contactId": "cmd_01..."
  }'`,
      response: `{
  "success": true,
  "flowId": "flow_01...",
  "contactId": "cmd_01..."
}`,
    },
  ],
};

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  const cls =
    method === "GET"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-green-100 text-green-800 border-green-200";
  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${cls}`}
    >
      {method}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: "read" | "send" | "write" }) {
  const s = SCOPES.find((x) => x.name === scope)!;
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${s.tone}`}>
      {scope}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-green-600">
            WaSend
          </Link>
          <nav className="text-sm text-gray-600 flex items-center gap-4">
            <a href="#auth" className="hover:text-gray-900">
              Kimlik doğrulama
            </a>
            <a href="#scopes" className="hover:text-gray-900">
              Scope
            </a>
            <a href="#rate-limit" className="hover:text-gray-900">
              Rate limit
            </a>
            <a href="#endpoints" className="hover:text-gray-900">
              Endpoint'ler
            </a>
            <a href="#webhooks" className="hover:text-gray-900">
              Webhooks
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        <section>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-green-600 font-semibold mb-2">
            <Code size={14} /> Public API v1
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            WaSend API Dokümantasyonu
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            REST üzerinden WhatsApp mesajı gönderin, kişi yönetin, flow tetikleyin.
            Bearer token + scope-based izin sistemi.
          </p>
        </section>

        {/* Auth */}
        <section id="auth">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Key size={20} /> Kimlik Doğrulama
          </h2>
          <p className="text-gray-700 mb-3">
            Her istek <code className="bg-gray-100 px-1 rounded text-sm">Authorization: Bearer ws_live_…</code>{" "}
            başlığı ile gönderilmelidir. Anahtarı{" "}
            <Link
              href="/dashboard/api-keys"
              className="text-green-600 underline"
            >
              Dashboard → API Anahtarları
            </Link>
            'ndan oluşturun. Plain text key sadece bir kez gösterilir; kaybederseniz
            yeni bir anahtar oluşturmanız gerekir.
          </p>
          <CopyBlock
            language="bash"
            code={`curl ${BASE}/api/v1/contacts \\
  -H "Authorization: Bearer ws_live_xxxxx"`}
          />
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 inline-flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              API key'i hiçbir zaman istemci tarafına (browser, mobile app) koymayın.
              Sadece sunucu tarafı entegrasyonlarda kullanın.
            </span>
          </div>
        </section>

        {/* Scopes */}
        <section id="scopes">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Shield size={20} /> Scope (Erişim İzinleri)
          </h2>
          <p className="text-gray-700 mb-4">
            Her API key bir veya birden fazla scope ile oluşturulur. Endpoint'ler
            belirli scope ister; eksikse <code>401</code> döner. Sadece ihtiyacınız
            olan scope'u verin — key sızarsa hasarı sınırlar.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {SCOPES.map((s) => (
              <div
                key={s.name}
                className={`border rounded-lg p-4 ${s.tone}`}
              >
                <div className="font-mono font-semibold text-sm">{s.name}</div>
                <div className="text-xs mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Rate limit */}
        <section id="rate-limit">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Gauge size={20} /> Rate Limit
          </h2>
          <p className="text-gray-700 mb-3">
            Her API key için varsayılan{" "}
            <strong>60 istek / dakika</strong> sliding window. Aşıldığında{" "}
            <code>429 Too Many Requests</code> + <code>Retry-After</code>{" "}
            başlığı döner.
          </p>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    Header
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    Açıklama
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">
                    X-RateLimit-Limit
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    Pencere başına izin verilen toplam istek
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">
                    X-RateLimit-Remaining
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    Pencere bitene kadar kalan kontenjan
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">
                    X-RateLimit-Reset
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    Pencerenin sıfırlanacağı UNIX epoch (saniye)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">Retry-After</td>
                  <td className="px-4 py-2 text-gray-600">
                    Sadece 429'da — kaç saniye sonra tekrar denemek mantıklı
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Send size={20} /> Endpoint'ler
          </h2>
          {Object.entries(ENDPOINTS).map(([group, eps]) => (
            <div key={group} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
                {group === "Mesajlar" ? (
                  <Send size={16} className="text-gray-500" />
                ) : group === "Kişiler" ? (
                  <Users size={16} className="text-gray-500" />
                ) : (
                  <GitBranch size={16} className="text-gray-500" />
                )}
                {group}
              </h3>
              <div className="space-y-6">
                {eps.map((ep) => (
                  <div
                    key={ep.method + ep.path}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="border-b border-gray-100 px-5 py-3 bg-gray-50 flex items-center gap-3 flex-wrap">
                      <MethodBadge method={ep.method} />
                      <code className="font-mono text-sm text-gray-900">
                        {ep.path}
                      </code>
                      <ScopeBadge scope={ep.scope} />
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <p className="text-sm text-gray-700">{ep.desc}</p>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                          İstek
                        </div>
                        <CopyBlock language="bash" code={ep.curl} />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                          Yanıt
                        </div>
                        <CopyBlock language="json" code={ep.response} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Webhooks */}
        <section id="webhooks">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Code size={20} /> Webhook'lar (Outgoing)
          </h2>
          <p className="text-gray-700 mb-3">
            Olaylar tetiklendiğinde WaSend, dashboard'da yapılandırdığınız URL'lere
            HMAC-SHA256 imzalı POST gönderir. İmzayı doğrulayın:
          </p>
          <CopyBlock
            language="js"
            code={`// Express.js örneği — secret dashboard'dan bir kez kopyalanır
import crypto from "crypto";

app.post("/wasend-webhook", express.raw({ type: "*/*" }), (req, res) => {
  const sig = req.header("X-Wasend-Signature") ?? "";
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.WASEND_SECRET)
    .update(req.body)
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(401).send("invalid signature");
  }
  const { event, data } = JSON.parse(req.body.toString("utf8"));
  console.log("event:", event, data);
  res.json({ received: true });
});`}
          />
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <strong>İpucu:</strong> Endpoint'iniz 5 saniyeden uzun sürerse veya
            HTTP 5xx dönerse otomatik retry kuyruğuna alınır. Son 60 saniyede
            5+ başarısızlık olursa circuit breaker 5 dakika devreye girer
            (diğer tenant'ların etkilenmemesi için). Manuel retry için
            dashboard → Webhooks → "Tekrar dene" butonu.
          </div>
        </section>

        {/* HTTP error codes */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">HTTP Hata Kodları</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    Kod
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    Anlamı
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-2 font-mono">200 / 202</td>
                  <td className="px-4 py-2 text-gray-600">
                    Başarılı (202 — geçici hata, retry kuyruğuna eklendi)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">400</td>
                  <td className="px-4 py-2 text-gray-600">
                    Validasyon hatası — JSON gövdesini ve scope'u kontrol edin
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">401</td>
                  <td className="px-4 py-2 text-gray-600">
                    API key eksik / geçersiz / scope yetersiz / iptal edilmiş
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">403</td>
                  <td className="px-4 py-2 text-gray-600">
                    Kişi opt-out olmuş — gönderim engellendi
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">404</td>
                  <td className="px-4 py-2 text-gray-600">
                    Kaynak bulunamadı (flowId, contactId vs.)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">429</td>
                  <td className="px-4 py-2 text-gray-600">
                    Rate limit aşıldı — Retry-After kadar bekleyin
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">500</td>
                  <td className="px-4 py-2 text-gray-600">
                    Sunucu hatası — kalıcı bir sorun ise{" "}
                    <a
                      className="underline"
                      href="mailto:destek@wasend.tech"
                    >
                      destek@wasend.tech
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 pt-12">
          Sorular için{" "}
          <a
            href="mailto:destek@wasend.tech"
            className="text-green-600 underline"
          >
            destek@wasend.tech
          </a>{" "}
          • Sistem durumu için{" "}
          <Link href="/status" className="text-green-600 underline">
            /status
          </Link>
        </p>
      </main>
    </div>
  );
}
