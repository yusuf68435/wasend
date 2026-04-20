"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "wasend_cookie_consent_v1";
type Consent = "accepted" | "rejected";

/**
 * KVKK + GDPR uyumlu cookie banner.
 * Kullanıcı karar verene kadar görünür. Zorunlu olmayan çerezler (analytics)
 * accepted olana kadar yüklenmez.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Microtask ile ertele — effect body'de setState anti-pattern'ini önle
    queueMicrotask(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    });
  }, []);

  function decide(consent: Consent) {
    localStorage.setItem(STORAGE_KEY, consent);
    setVisible(false);

    if (consent === "accepted") {
      // Analytics / marketing çerezlerini başlat (şimdi placeholder).
      // Gelecekte Google Analytics / Mixpanel buraya gelecek.
      window.dispatchEvent(new CustomEvent("cookie-consent", { detail: consent }));
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md bg-white border border-gray-200 shadow-xl rounded-xl p-5"
    >
      <div className="flex items-start gap-3 mb-3">
        <Cookie size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Çerezleri kullanıyoruz</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Zorunlu oturum çerezleri her zaman aktifdir. Analitik çerezleri
            kabul etmeniz halinde kullanım deneyimini iyileştirmek için
            kullanılır.{" "}
            <Link href="/privacy" className="text-green-600 underline">
              Detay
            </Link>
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => decide("rejected")}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
        >
          Sadece zorunlu
        </button>
        <button
          onClick={() => decide("accepted")}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Tümünü kabul et
        </button>
      </div>
    </div>
  );
}
