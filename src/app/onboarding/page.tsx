"use client";

/**
 * Onboarding wizard — yeni firmalar için 4 adımlı kurulum.
 *
 * Adımlar:
 *   1. İşletme Bilgileri — isim + tür
 *   2. WhatsApp Bağlantısı — Phone Number ID yapıştır + Meta rehberi
 *   3. Test Mesajı — kendi numarasına test gönder
 *   4. Bitti — dashboard'a yönlendir
 *
 * State localStorage'da tutulmaz; kaynak DB (user.onboardingStep).
 * Her adım PATCH /api/onboarding ile server'a kaydedilir; refresh'te
 * kullanıcı kaldığı yerden devam eder.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Loader2,
  PartyPopper,
  MessageSquare,
  Building2,
  Phone as PhoneIcon,
} from "lucide-react";

type Status = {
  completed: boolean;
  step: number;
  totalSteps: number;
  businessName: string;
  businessType: string;
  phoneNumberId: string;
};

const BUSINESS_TYPES = [
  { v: "kuafor", l: "Kuaför / Güzellik Salonu" },
  { v: "restoran", l: "Restoran / Kafe" },
  { v: "klinik", l: "Klinik / Sağlık" },
  { v: "esnaf", l: "Esnaf / Dükkan" },
  { v: "ecommerce", l: "E-ticaret" },
  { v: "diger", l: "Diğer" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((s: Status) => {
        setStatus(s);
        setBusinessName(s.businessName);
        setBusinessType(s.businessType);
        setPhoneNumberId(s.phoneNumberId);
        if (s.completed) router.replace("/dashboard");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function saveAndAdvance(data: Record<string, unknown>, nextStep: number) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, step: nextStep }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Kaydedilemedi");
        return false;
      }
      setStatus((s) => (s ? { ...s, step: nextStep } : s));
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function goBack() {
    if (!status) return;
    await saveAndAdvance({}, Math.max(0, status.step - 1));
  }

  async function finish() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Tamamlanamadı");
        return;
      }
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Test mesajı gönderilemedi");
        return;
      }
      setTestSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#6e6e73] text-[13px]">
        <Loader2 size={16} className="animate-spin" /> Yükleniyor...
      </div>
    );
  }
  if (!status) {
    return <p className="text-[#ff3b30] text-[13px]">Durum alınamadı.</p>;
  }

  const step = status.step;

  return (
    <div>
      {/* Progress header */}
      <div className="mb-10">
        <div className="flex items-center gap-1.5 text-[11px] text-[#6e6e73] tracking-[0.08em] uppercase mb-3">
          Kurulum · Adım {Math.min(step + 1, status.totalSteps)} / {status.totalSteps}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: status.totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i < step ? "bg-[#1d1d1f]" : i === step ? "bg-[#1d1d1f]" : "bg-[#d2d2d7]"
              }`}
            />
          ))}
        </div>
      </div>

      {err && (
        <div className="mb-6 bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] rounded-2xl px-4 py-3 text-[13px] tracking-tight">
          {err}
        </div>
      )}

      {/* STEP 0: Welcome */}
      {step === 0 && (
        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mb-5">
            <MessageSquare size={22} />
          </div>
          <h1 className="display-md text-[#1d1d1f] mb-3">WaSend&apos;e hoş geldin</h1>
          <p className="text-[15px] text-[#6e6e73] tracking-tight leading-relaxed mb-8">
            Müşterilerinle WhatsApp üzerinden otomatik iletişim kurmana 5 dakika
            kaldı. Üç adımda kurulum bitir, ilk mesajını gönder.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "İşletme bilgilerini tanıt",
              "WhatsApp Business numaranı bağla",
              "Test mesajı ile doğrula",
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                <span className="w-6 h-6 rounded-full bg-[#f5f5f7] text-[#6e6e73] text-[11px] flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => saveAndAdvance({}, 1)}
            disabled={busy}
            className="bg-[#1d1d1f] text-white px-5 h-11 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            Başla <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* STEP 1: Business info */}
      {step === 1 && (
        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center mb-5">
            <Building2 size={22} />
          </div>
          <h1 className="display-md text-[#1d1d1f] mb-3">İşletmen hakkında</h1>
          <p className="text-[15px] text-[#6e6e73] tracking-tight mb-8">
            Müşterilere gönderilen mesajlarda markan olarak görünür.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!businessName.trim()) {
                setErr("İşletme adı gerekli");
                return;
              }
              await saveAndAdvance(
                {
                  businessName: businessName.trim(),
                  businessType: businessType || undefined,
                },
                2,
              );
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">
                İşletme Adı
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Örn. Ahmet Kuaför"
                required
                maxLength={120}
                className="w-full h-11 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">
                İşletme Türü
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full h-11 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              >
                <option value="">Seçim yap (opsiyonel)</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={goBack}
                disabled={busy}
                className="text-[#6e6e73] hover:text-[#1d1d1f] text-[13px] tracking-tight inline-flex items-center gap-1 transition"
              >
                <ArrowLeft size={14} /> Geri
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#1d1d1f] text-white px-5 h-11 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                Devam <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: WhatsApp Phone ID */}
      {step === 2 && (
        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mb-5">
            <PhoneIcon size={22} />
          </div>
          <h1 className="display-md text-[#1d1d1f] mb-3">WhatsApp&apos;ı bağla</h1>
          <p className="text-[15px] text-[#6e6e73] tracking-tight leading-relaxed mb-6">
            Meta Business Manager&apos;dan <b>Phone Number ID</b>&apos;ni kopyala ve
            aşağıya yapıştır.
          </p>

          <div className="bg-[#f5f5f7] rounded-2xl p-5 mb-6">
            <p className="text-[12px] text-[#6e6e73] tracking-tight mb-3 font-medium uppercase">
              Adımlar
            </p>
            <ol className="space-y-2.5 text-[13px] text-[#1d1d1f] leading-relaxed">
              <li>
                1.{" "}
                <a
                  href="https://business.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#007aff] hover:underline inline-flex items-center gap-1"
                >
                  business.facebook.com <ExternalLink size={11} />
                </a>{" "}
                &raquo; WhatsApp hesabı oluştur
              </li>
              <li>
                2.{" "}
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#007aff] hover:underline inline-flex items-center gap-1"
                >
                  Cloud API başlangıç rehberini{" "}
                  <ExternalLink size={11} />
                </a>{" "}
                takip et
              </li>
              <li>3. Developers paneli &raquo; WhatsApp &raquo; API Setup ekranından <b>Phone number ID</b> kopyala</li>
              <li>4. Aşağıya yapıştır</li>
            </ol>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = phoneNumberId.trim();
              if (!/^\d{10,20}$/.test(p)) {
                setErr("Phone Number ID sadece rakam olmalı (10-20 basamak)");
                return;
              }
              await saveAndAdvance({ phoneNumberId: p }, 3);
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">
                Phone Number ID
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value.replace(/\D/g, ""))}
                placeholder="Örn. 105623456789012"
                inputMode="numeric"
                pattern="\d{10,20}"
                required
                className="w-full h-11 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] font-mono focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              />
              <p className="text-[11px] text-[#6e6e73] tracking-tight mt-1.5">
                Bu ID, Meta Business Manager&apos;dan aldığın 15+ basamaklı rakamdır.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={goBack}
                disabled={busy}
                className="text-[#6e6e73] hover:text-[#1d1d1f] text-[13px] tracking-tight inline-flex items-center gap-1 transition"
              >
                <ArrowLeft size={14} /> Geri
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#1d1d1f] text-white px-5 h-11 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                Devam <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Test message */}
      {step === 3 && (
        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mb-5">
            <MessageSquare size={22} />
          </div>
          <h1 className="display-md text-[#1d1d1f] mb-3">Test mesajı</h1>
          <p className="text-[15px] text-[#6e6e73] tracking-tight leading-relaxed mb-8">
            Kendi numarana bir test mesajı gönder, bağlantının çalıştığını
            doğrula. Dilersen atla.
          </p>

          {!testSent ? (
            <form onSubmit={sendTest} className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">
                  Cep Numaran
                </label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+905xxxxxxxxx"
                  required
                  pattern="\+?\d{10,15}"
                  className="w-full h-11 px-3.5 bg-white border border-[#d2d2d7] rounded-xl text-[14px] font-mono focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
                />
                <p className="text-[11px] text-[#6e6e73] tracking-tight mt-1.5">
                  E.164 formatı: ülke kodu + numara, boşluk yok. Örn.
                  +905321234567
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => saveAndAdvance({}, 4).then(() => finish())}
                  disabled={busy}
                  className="text-[#6e6e73] hover:text-[#1d1d1f] text-[13px] tracking-tight transition"
                >
                  Atla
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={busy}
                    className="text-[#6e6e73] hover:text-[#1d1d1f] text-[13px] tracking-tight inline-flex items-center gap-1 transition"
                  >
                    <ArrowLeft size={14} /> Geri
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#25D366] text-white px-5 h-11 rounded-full text-[14px] font-medium tracking-tight hover:bg-[#20bf5a] transition disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {busy ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />{" "}
                        Gönderiliyor
                      </>
                    ) : (
                      <>
                        <MessageSquare size={14} /> Test Gönder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-start gap-3 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-5 mb-6">
                <CheckCircle2 size={20} className="text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-[#1d1d1f] tracking-tight">
                    Test mesajı gönderildi
                  </p>
                  <p className="text-[13px] text-[#6e6e73] tracking-tight mt-0.5">
                    WhatsApp&apos;ını kontrol et. Mesaj gelmediyse Phone Number ID
                    doğru mu ve numaranın WhatsApp Business kayıtlı olup
                    olmadığını kontrol et.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setTestSent(false)}
                  disabled={busy}
                  className="text-[#6e6e73] hover:text-[#1d1d1f] text-[13px] tracking-tight transition"
                >
                  Tekrar dene
                </button>
                <button
                  type="button"
                  onClick={() => saveAndAdvance({}, 4)}
                  disabled={busy}
                  className="bg-[#1d1d1f] text-white px-5 h-11 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50 inline-flex items-center gap-2"
                >
                  Devam <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Done */}
      {step >= 4 && (
        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mx-auto mb-6">
            <PartyPopper size={28} />
          </div>
          <h1 className="display-md text-[#1d1d1f] mb-3">Kurulum tamam!</h1>
          <p className="text-[15px] text-[#6e6e73] tracking-tight leading-relaxed mb-8 max-w-md mx-auto">
            Artık müşterilerini ekleyip otomatik cevap kuralları
            oluşturabilir, toplu mesaj gönderebilirsin.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={finish}
              disabled={busy}
              className="bg-[#1d1d1f] text-white px-6 h-11 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50 inline-flex items-center gap-2 justify-center"
            >
              Panele Git <ArrowRight size={16} />
            </button>
            <Link
              href="/dashboard/contacts"
              className="bg-white border border-[#d2d2d7] text-[#1d1d1f] px-6 h-11 rounded-full text-[14px] font-medium tracking-tight hover:border-[#1d1d1f]/30 transition inline-flex items-center gap-2 justify-center"
            >
              Kişi Ekle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
