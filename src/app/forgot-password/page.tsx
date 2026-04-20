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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">WaSend</h1>
          <p className="text-gray-500 mt-2">Şifre sıfırlama</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="ornek@email.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              Hesabınıza kayıtlı e-posta adresini girin.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link
            href="/login"
            className="text-green-600 font-medium hover:underline"
          >
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
