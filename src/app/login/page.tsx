"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams?.get("registered") === "true";
  const verified = searchParams?.get("verified") === "true";
  const next = searchParams?.get("next") || "/dashboard";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      const err = result.error;
      if (err.includes("silindi")) {
        setError("Hesabınız silinmiş. Yeni hesap açmak için kayıt olun.");
      } else if (err.includes("askıya")) {
        setError(err);
      } else {
        setError("Giriş yapılamadı. E-posta veya şifreyi kontrol edin.");
      }
      setLoading(false);
    } else {
      router.push(next);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">WaSend</h1>
          <p className="text-gray-500 mt-2">WhatsApp Otomasyon Platformu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(registered || verified) && (
            <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              {verified
                ? "E-posta doğrulandı. Giriş yapabilirsin."
                : "Kayıt başarılı! E-postana gönderdiğimiz bağlantıyla doğrulama yap, sonra giriş yapabilirsin."}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
              {error.includes("askıya") && (
                <div className="mt-2">
                  Destek için:{" "}
                  <a
                    href="mailto:support@wasend.tech"
                    className="underline font-medium"
                  >
                    support@wasend.tech
                  </a>
                </div>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-posta
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700"
              >
                Şifre
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-green-600 hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-green-600 font-medium hover:underline">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Yükleniyor...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
