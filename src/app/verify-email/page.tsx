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
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4">
      <div className="w-full max-w-[420px] text-center">
        {state === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
              <Loader2
                size={24}
                strokeWidth={1.75}
                className="text-[#1d1d1f] animate-spin"
              />
            </div>
            <h1 className="display-md text-[#1d1d1f]">Doğrulanıyor…</h1>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#30d158]/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2
                size={28}
                strokeWidth={1.75}
                className="text-[#30d158]"
              />
            </div>
            <h1 className="display-md text-[#1d1d1f]">E-posta doğrulandı.</h1>
            <p className="text-[15px] text-[#6e6e73] mt-4 tracking-tight">
              Hesabın aktive edildi. Artık giriş yapabilirsin.
            </p>
            <Link
              href="/login"
              className="inline-block mt-8 bg-[#1d1d1f] text-white px-7 py-3 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition"
            >
              Giriş yap
            </Link>
          </>
        )}

        {state === "already" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2
                size={28}
                strokeWidth={1.75}
                className="text-[#1d1d1f]"
              />
            </div>
            <h1 className="display-md text-[#1d1d1f]">Zaten doğrulanmış.</h1>
            <p className="text-[15px] text-[#6e6e73] mt-4 tracking-tight">
              Doğrudan giriş yapabilirsin.
            </p>
            <Link
              href="/login"
              className="inline-block mt-8 bg-[#1d1d1f] text-white px-7 py-3 rounded-full text-[14px] font-medium tracking-tight hover:bg-black transition"
            >
              Giriş yap
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#ff453a]/10 flex items-center justify-center mx-auto mb-6">
              <XCircle
                size={28}
                strokeWidth={1.75}
                className="text-[#ff453a]"
              />
            </div>
            <h1 className="display-md text-[#1d1d1f]">Doğrulama başarısız.</h1>
            <p className="text-[15px] text-[#6e6e73] mt-4 tracking-tight">
              {error || "Bağlantı geçersiz veya süresi dolmuş."}
            </p>
            <div className="flex gap-3 justify-center mt-8">
              <Link
                href="/login"
                className="border border-[#d2d2d7] text-[#1d1d1f] px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-[#f5f5f7] transition"
              >
                Giriş sayfası
              </Link>
              <Link
                href="/register"
                className="bg-[#1d1d1f] text-white px-5 py-2.5 rounded-full text-[13px] font-medium tracking-tight hover:bg-black transition"
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
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#6e6e73] text-[13px] tracking-tight">
          Yükleniyor…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
