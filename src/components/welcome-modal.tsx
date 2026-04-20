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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative">
        <button
          onClick={close}
          aria-label="Kapat"
          className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 text-green-600 rounded-full mb-4">
            <Sparkles size={28} />
          </div>
          <h2 id="welcome-title" className="text-2xl font-bold text-gray-900 mb-2">
            WaSend&apos;e hoş geldin!
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Aşağıdaki 4 adımı takip et, 10 dakikada WhatsApp otomasyonun çalışır durumda olsun.
          </p>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 text-left">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center text-green-600">
                {current.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{current.title}</h3>
                <p className="text-sm text-gray-600">{current.description}</p>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 justify-center mb-6" role="tablist">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`Adım ${i + 1}`}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step ? "bg-green-600 w-8" : "bg-gray-300 w-2 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Sonra yap
            </button>
            {current.href && (
              <Link
                href={current.href}
                onClick={close}
                className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                {current.action}
                <ArrowRight size={14} />
              </Link>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
              >
                Sonraki
              </button>
            ) : (
              <button
                onClick={close}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
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
