"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/admin";
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Doğrulanamadı");
      return;
    }
    router.replace(next);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4">
      <div className="w-full max-w-[400px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
          <Shield size={22} strokeWidth={1.75} className="text-[#1d1d1f]" />
        </div>
        <h1 className="display-md text-[#1d1d1f]">İki aşamalı doğrulama.</h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 tracking-tight">
          Authenticator uygulamasındaki 6 haneli kodu gir.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4 text-left">
          {error && (
            <div className="bg-[#ff453a]/10 text-[#ff453a] text-[13px] px-4 py-3 rounded-2xl tracking-tight">
              {error}
            </div>
          )}
          <input
            autoFocus
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={8}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="000000"
            className="w-full px-4 py-4 bg-white border border-[#d2d2d7] rounded-2xl text-center text-[28px] font-mono tracking-[0.3em] text-[#1d1d1f] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-full bg-[#1d1d1f] text-white text-[14px] font-medium tracking-tight hover:bg-black disabled:opacity-50 transition"
          >
            {busy ? "Doğrulanıyor…" : "Doğrula"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Verify2faPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd]" />}>
      <VerifyForm />
    </Suspense>
  );
}
