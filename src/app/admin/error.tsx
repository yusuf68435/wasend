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
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Admin panel hatası
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Bir işlem başarısız oldu. Lütfen tekrar deneyin.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono mb-4">
            {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
          >
            Tekrar dene
          </button>
          <a
            href="/admin"
            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Admin&apos;e dön
          </a>
        </div>
      </div>
    </div>
  );
}
