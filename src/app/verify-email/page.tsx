"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [state, setState] = useState<"loading" | "success" | "already" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setState("error");
        setError("Doğrulama bağlantısı geçersiz.");
      });
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setState("error");
          setError(data.error || "Doğrulama başarısız");
          return;
        }
        setState(data.alreadyVerified ? "already" : "success");
      })
      .catch(() => {
        setState("error");
        setError("Ağ hatası. Lütfen tekrar deneyin.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        {state === "loading" && (
          <>
            <Loader2 size={48} className="mx-auto text-green-600 animate-spin mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              E-postanız doğrulanıyor...
            </h1>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              E-posta doğrulandı
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Hesabınız aktive edildi. Artık giriş yapabilirsiniz.
            </p>
            <Link
              href="/login"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Giriş yap
            </Link>
          </>
        )}

        {state === "already" && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-blue-600 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Bu e-posta zaten doğrulanmış
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Doğrudan giriş yapabilirsiniz.
            </p>
            <Link
              href="/login"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Giriş yap
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle size={48} className="mx-auto text-red-600 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Doğrulama başarısız
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {error || "Bağlantı geçersiz veya süresi dolmuş."}
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/login"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Giriş sayfası
              </Link>
              <Link
                href="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
              >
                Yeniden kayıt ol
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Yükleniyor...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
