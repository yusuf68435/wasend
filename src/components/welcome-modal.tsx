"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Users, Bot, Settings, Send, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "wasend_welcome_seen_v1";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  action?: string;
}

const STEPS: Step[] = [
  {
    icon: <Settings size={24} />,
    title: "1. WhatsApp Business hesabını bağla",
    description:
      "Meta Cloud API üzerinden Phone Number ID ve token'ını ayarlardan gir.",
    href: "/dashboard/settings",
    action: "Ayarlara git",
  },
  {
    icon: <Users size={24} />,
    title: "2. İlk kişini ekle",
    description:
      "Tek kişi el ile ya da CSV dosyasıyla yüzlerce kişi bir kerede içeri aktarılır.",
    href: "/dashboard/contacts",
    action: "Kişi ekle",
  },
  {
    icon: <Bot size={24} />,
    title: "3. Otomatik cevap kuralı kur",
    description:
      "Belirli kelimelere otomatik yanıt ver. Örn: 'fiyat' → fiyat listesi gönder.",
    href: "/dashboard/auto-replies",
    action: "Kural oluştur",
  },
  {
    icon: <Send size={24} />,
    title: "4. İlk toplu mesajını gönder",
    description:
      "Segment veya etiket bazlı kampanya oluştur, tek tıkla herkese gönder.",
    href: "/dashboard/broadcasts",
    action: "Kampanya başlat",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    });
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-[520px] w-full relative">
        <button
          onClick={close}
          aria-label="Kapat"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#f5f5f7] text-[#1d1d1f] rounded-2xl mb-6">
            <Sparkles size={22} strokeWidth={1.75} />
          </div>
          <h2
            id="welcome-title"
            className="display-md text-[#1d1d1f]"
          >
            WaSend&apos;e hoş geldin.
          </h2>
          <p className="text-[15px] text-[#6e6e73] mt-3 mb-8 tracking-tight">
            4 adım, 10 dakika. WhatsApp otomasyonun çalışır durumda olsun.
          </p>

          <div className="bg-[#fbfbfd] border border-[#d2d2d7] rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 bg-white border border-[#d2d2d7] rounded-xl flex items-center justify-center text-[#1d1d1f]">
                {current.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold tracking-tight text-[#1d1d1f] text-[15px] mb-1">
                  {current.title}
                </h3>
                <p className="text-[13px] text-[#6e6e73] tracking-tight leading-relaxed">
                  {current.description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 justify-center mb-8" role="tablist">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Adım ${i + 1}`}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "bg-[#1d1d1f] w-6"
                    : "bg-[#d2d2d7] w-1.5 hover:bg-[#86868b]"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={close}
              className="px-4 py-2 rounded-full text-[13px] font-medium tracking-tight text-[#6e6e73] hover:bg-[#f5f5f7] transition"
            >
              Sonra yap
            </button>
            {current.href && (
              <Link
                href={current.href}
                onClick={close}
                className="inline-flex items-center gap-1.5 bg-[#1d1d1f] text-white px-4 py-2 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
              >
                {current.action}
                <ArrowRight size={14} />
              </Link>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="px-4 py-2 rounded-full text-[13px] font-medium tracking-tight border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
              >
                Sonraki
              </button>
            ) : (
              <button
                onClick={close}
                className="px-4 py-2 rounded-full text-[13px] font-medium tracking-tight border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition"
              >
                Tamamla
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
