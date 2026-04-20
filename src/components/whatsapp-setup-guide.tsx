"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface TestResult {
  ok: boolean;
  verifiedName?: string;
  displayPhone?: string;
  qualityRating?: string;
  error?: string;
}

const STEPS = [
  {
    num: 1,
    title: "Meta Business hesabı oluştur",
    body: (
      <>
        <p className="mb-2">
          <a
            href="https://business.facebook.com"
            target="_blank"
            rel="noopener"
            className="text-green-600 underline inline-flex items-center gap-1"
          >
            business.facebook.com <ExternalLink size={12} />
          </a>{" "}
          → <strong>Business hesabı oluştur</strong>.
        </p>
        <p className="text-xs text-slate-500">
          Gerçek bir işletme adı ve email ile kaydol. Bu hesap tüm Meta
          işletme araçlarının (Ads, WhatsApp, Instagram Business) kökü olur.
        </p>
      </>
    ),
  },
  {
    num: 2,
    title: "Meta Developer hesabı oluştur",
    body: (
      <>
        <p className="mb-2">
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener"
            className="text-green-600 underline inline-flex items-center gap-1"
          >
            developers.facebook.com <ExternalLink size={12} />
          </a>{" "}
          → <strong>Get Started</strong>.
        </p>
        <p className="text-xs text-slate-500">
          Business hesabınla aynı Facebook kullanıcısıyla giriş yap. Developer
          hesabı Business hesaba linkli olacak.
        </p>
      </>
    ),
  },
  {
    num: 3,
    title: "Yeni App oluştur (tür: Business)",
    body: (
      <>
        <p className="mb-2">
          <strong>My Apps</strong> → <strong>Create App</strong> → use case:
          &quot;Other&quot; → type: <strong>Business</strong> → isim: WaSend.
        </p>
        <p className="text-xs text-slate-500">
          Business tipi zorunlu. Consumer tipi WhatsApp Cloud API&apos;ı görmez.
        </p>
      </>
    ),
  },
  {
    num: 4,
    title: "WhatsApp Product ekle",
    body: (
      <>
        <p className="mb-2">
          App dashboard&apos;unda <strong>Add Product</strong> → WhatsApp kartına
          tıkla → <strong>Set Up</strong>.
        </p>
        <p className="text-xs text-slate-500">
          Geçici bir test numarası otomatik verilir. Prod için kendi numaranı
          daha sonra ekleyebilirsin.
        </p>
      </>
    ),
  },
  {
    num: 5,
    title: "Credentials'ları al ve aşağıya gir",
    body: (
      <>
        <p className="mb-2">
          WhatsApp → <strong>API Setup</strong> sayfasında:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-2">
          <li>
            <strong>Phone number ID</strong> — aşağıdaki test kutusuna yapıştır
          </li>
          <li>
            <strong>Temporary access token</strong> — 24 saat geçerli, test için
            uygun
          </li>
          <li>
            Prod için: <strong>System User</strong> oluştur, permanent token
            (365 gün+) üret
          </li>
        </ul>
      </>
    ),
  },
  {
    num: 6,
    title: "Webhook'u WaSend'e yönlendir",
    body: (
      <>
        <p className="mb-2">WhatsApp → Configuration → Webhooks:</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            Callback URL:{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
              https://wasend.tech/api/webhook
            </code>
          </li>
          <li>
            Verify Token: Ayarlar sayfasındaki{" "}
            <em>WhatsApp Verify Token</em> değerini kopyala
          </li>
          <li>
            <strong>Verify and Save</strong>
          </li>
          <li>
            Subscribe: <code>messages</code>, <code>message_status</code>
          </li>
        </ul>
      </>
    ),
  },
];

export function WhatsAppSetupGuide() {
  const [open, setOpen] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function runTest(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    setResult(null);
    const res = await fetch("/api/settings/test-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId, apiToken }),
    });
    const data = await res.json();
    setTesting(false);
    setResult(data);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <div>
          <h3 className="font-semibold text-gray-900 inline-flex items-center gap-2">
            🟢 WhatsApp Kurulum Rehberi
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Meta Developer panelinden credentials alıp bağlantıyı test et. ~15 dakika.
          </p>
        </div>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <ol className="space-y-5">
            {STEPS.map((step) => (
              <li key={step.num} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full inline-flex items-center justify-center text-sm font-semibold">
                  {step.num}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                  <div className="text-sm text-gray-700">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>

          <form
            onSubmit={runTest}
            className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4"
          >
            <h4 className="font-semibold text-gray-900 mb-3">
              🧪 Test bağlantısı
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Credentials&apos;ları buraya yapıştır → Meta Graph API&apos;ye ping atarız.
              Başarılıysa <em>Ayarlar</em> sayfasındaki alanlara gir, kaydet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label
                  htmlFor="test-phone-id"
                  className="text-xs text-gray-600 mb-1 block"
                >
                  Phone Number ID
                </label>
                <input
                  id="test-phone-id"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="1064..."
                />
              </div>
              <div>
                <label
                  htmlFor="test-token"
                  className="text-xs text-gray-600 mb-1 block"
                >
                  Access Token
                </label>
                <input
                  id="test-token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="EAAW..."
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={testing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {testing && <Loader2 size={14} className="animate-spin" />}
              {testing ? "Test ediliyor..." : "Test et"}
            </button>

            {result && (
              <div
                className={
                  "mt-3 rounded-lg p-3 text-sm " +
                  (result.ok
                    ? "bg-green-50 border border-green-200 text-green-900"
                    : "bg-red-50 border border-red-200 text-red-900")
                }
              >
                {result.ok ? (
                  <>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <CheckCircle2 size={16} /> Bağlantı başarılı
                    </div>
                    <dl className="text-xs space-y-0.5">
                      {result.verifiedName && (
                        <div>
                          <dt className="inline font-medium">İşletme:</dt>{" "}
                          <dd className="inline">{result.verifiedName}</dd>
                        </div>
                      )}
                      {result.displayPhone && (
                        <div>
                          <dt className="inline font-medium">Telefon:</dt>{" "}
                          <dd className="inline">{result.displayPhone}</dd>
                        </div>
                      )}
                      {result.qualityRating && (
                        <div>
                          <dt className="inline font-medium">Kalite:</dt>{" "}
                          <dd className="inline">{result.qualityRating}</dd>
                        </div>
                      )}
                    </dl>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <XCircle size={16} /> Bağlantı başarısız
                    </div>
                    <p className="text-xs">{result.error}</p>
                  </>
                )}
              </div>
            )}
          </form>

          <p className="text-xs text-gray-500 mt-4">
            Daha fazla bilgi:{" "}
            <Link href="/blog/whatsapp-business-api-nedir" className="text-green-600 underline">
              WhatsApp Business API nedir
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
