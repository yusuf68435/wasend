"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Bir hata oluştu");
      return;
    }
    setMessage(data.message || "Bağlantı gönderildi");
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
          <h1 className="display-md mt-8 text-[#1d1d1f]">Şifreni sıfırla.</h1>
          <p className="text-[15px] text-[#6e6e73] mt-2 tracking-tight">
            E-postana sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {message && (
            <div className="bg-[#30d158]/10 text-[#1d1d1f] px-4 py-3 rounded-2xl text-[13px] tracking-tight">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-[#ff453a]/10 text-[#ff453a] px-4 py-3 rounded-2xl text-[13px] tracking-tight">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="fp-email"
              className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5 tracking-tight"
            >
              E-posta
            </label>
            <input
              id="fp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className="w-full px-4 h-11 bg-white border border-[#d2d2d7] rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
            />
            <p className="text-[12px] text-[#86868b] mt-1.5 tracking-tight">
              Hesabına kayıtlı e-posta adresini gir.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-[#1d1d1f] text-white text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50"
          >
            {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
          </button>
        </form>

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
