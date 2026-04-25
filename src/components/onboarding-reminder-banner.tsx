"use client";

/**
 * Onboarding reminder banner — kurulum atlanmışsa dashboard üstünde gösterilir.
 *
 * Mantık:
 *   - GET /api/onboarding → { skipped: true } ise banner görünür.
 *   - localStorage 'wsnd:onboarding-banner-dismissed' set ise gizlenir
 *     (kullanıcı isterse manuel kapatır, ama bu oturum içi tutulur).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "wsnd:onboarding-banner-dismissed";

export function OnboardingReminderBanner() {
  const [skipped, setSkipped] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setDismissed(true);
      return;
    }
    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.skipped) setSkipped(true);
      })
      .catch(() => {});
  }, []);

  if (!skipped || dismissed) return null;

  return (
    <div className="mb-4 bg-gradient-to-r from-[#1d1d1f] to-[#2d2d2f] text-white rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium tracking-tight">
          Kurulumun yarım kaldı
        </p>
        <p className="text-[12px] text-white/70 tracking-tight">
          WhatsApp&apos;ını bağla ve test mesajı gönder — tüm özellikler aktif olsun.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="bg-white text-[#1d1d1f] px-4 h-9 rounded-full text-[12px] font-medium tracking-tight inline-flex items-center gap-1.5 hover:bg-white/90 transition flex-shrink-0"
      >
        Tamamla <ArrowRight size={12} />
      </Link>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        aria-label="Bildirimi kapat"
        className="text-white/50 hover:text-white transition flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
