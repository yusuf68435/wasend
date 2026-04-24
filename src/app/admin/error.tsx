"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-[#d2d2d7] rounded-3xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#ff453a]/10 rounded-2xl mb-5">
          <AlertTriangle size={22} className="text-[#ff453a]" strokeWidth={1.75} />
        </div>
        <h2 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] mb-1">
          Admin panel hatası
        </h2>
        <p className="text-[14px] text-[#6e6e73] mb-6 tracking-tight leading-relaxed">
          Bir işlem başarısız oldu. Lütfen tekrar deneyin.
        </p>
        {error.digest && (
          <p className="text-[11px] text-[#86868b] font-mono mb-5">
            {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
          >
            Tekrar dene
          </button>
          <a
            href="/admin"
            className="border border-[#d2d2d7] text-[#1d1d1f] px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-[#f5f5f7] transition"
          >
            Admin&apos;e dön
          </a>
        </div>
      </div>
    </div>
  );
}
