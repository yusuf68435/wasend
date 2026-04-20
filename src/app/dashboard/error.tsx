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
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Bir şeyler ters gitti</h2>
        <p className="text-sm text-gray-500 mb-4">
          Beklenmedik bir hata oluştu. Yeniden denemeyi deneyin; sorun sürerse
          destek ile iletişime geçin.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-4">
            Hata kodu: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Tekrar dene
          </button>
          <a
            href="/dashboard"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Panele dön
          </a>
        </div>
      </div>
    </div>
  );
}
