"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Şifre güncellenemedi");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="display-md text-[#1d1d1f]">Geçersiz bağlantı.</h1>
          <p className="text-[15px] text-[#6e6e73] mt-4 tracking-tight">
            Şifre sıfırlama bağlantısı eksik. E-postadaki bağlantıya tekrar
            tıkla veya yeni bir sıfırlama talebi oluştur.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block mt-8 text-[13px] text-[#1d1d1f] hover:underline underline-offset-4 tracking-tight font-medium"
          >
            Yeni bağlantı talep et
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[22px] font-semibold tracking-tight text-[#1d1d1f]"
          >
            WaSend
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full bg-[#25D366]"
            />
          </Link>
          <h1 className="display-md mt-8 text-[#1d1d1f]">Yeni şifre belirle.</h1>
          <p className="text-[15px] text-[#6e6e73] mt-2 tracking-tight">
            En az 8 karakter olsun.
          </p>
        </div>

        {success ? (
          <div className="bg-[#30d158]/10 text-[#1d1d1f] px-5 py-5 rounded-2xl text-center tracking-tight">
            <p className="font-medium text-[15px]">
              Şifren başarıyla güncellendi.
            </p>
            <p className="text-[13px] text-[#6e6e73] mt-1.5">
              Giriş sayfasına yönlendiriliyorsun…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="bg-[#ff453a]/10 text-[#ff453a] px-4 py-3 rounded-2xl text-[13px] tracking-tight">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="rp-password"
                className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5 tracking-tight"
              >
                Yeni şifre
              </label>
              <input
                id="rp-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
                className="w-full px-4 h-11 bg-white border border-[#d2d2d7] rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="rp-confirm"
                className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5 tracking-tight"
              >
                Şifre tekrar
              </label>
              <input
                id="rp-confirm"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 h-11 bg-white border border-[#d2d2d7] rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-[#1d1d1f] text-white text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50"
            >
              {loading ? "Güncelleniyor…" : "Şifreyi güncelle"}
            </button>
          </form>
        )}

        <p className="text-center text-[13px] text-[#6e6e73] mt-8 tracking-tight">
          <Link
            href="/login"
            className="text-[#1d1d1f] font-medium hover:underline underline-offset-4"
          >
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#6e6e73] text-[13px] tracking-tight">
          Yükleniyor…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
