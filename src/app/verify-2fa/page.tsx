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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <Shield className="mx-auto text-amber-500 mb-3" size={32} />
        <h1 className="text-xl font-bold text-center text-slate-900 mb-1">
          İki Aşamalı Doğrulama
        </h1>
        <p className="text-sm text-center text-slate-500 mb-6">
          Authenticator uygulamasındaki 6 haneli kodu gir.
        </p>
        <form onSubmit={submit} className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded">
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
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-amber-500"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {busy ? "Doğrulanıyor..." : "Doğrula"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Verify2faPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <VerifyForm />
    </Suspense>
  );
}
