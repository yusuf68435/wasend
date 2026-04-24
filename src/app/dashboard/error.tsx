"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-[#d2d2d7] rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#ff3b30]/10 rounded-full mb-4">
          <AlertTriangle size={24} className="text-[#ff3b30]" aria-hidden />
        </div>
        <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">
          Bir şeyler ters gitti
        </h2>
        <p className="text-[14px] text-[#6e6e73] mb-4 tracking-tight">
          Beklenmedik bir hata oluştu. Yeniden denemeyi deneyin; sorun sürerse
          destek ile iletişime geçin.
        </p>
        {error.digest && (
          <p className="text-[12px] text-[#86868b] font-mono mb-4">
            Hata kodu: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-[#1d1d1f] text-white px-4 h-10 rounded-full text-[14px] font-medium hover:bg-black tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 transition"
          >
            Tekrar dene
          </button>
          <a
            href="/dashboard"
            className="border border-[#d2d2d7] text-[#1d1d1f] px-4 h-10 inline-flex items-center rounded-full text-[14px] font-medium hover:bg-[#f5f5f7] tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 transition"
          >
            Panele dön
          </a>
        </div>
      </div>
    </div>
  );
}
