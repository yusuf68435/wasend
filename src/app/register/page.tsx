"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/password-strength";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get("invite") ?? null;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!termsAccepted) {
      setError("Devam edebilmek için KVKK onayını işaretlemelisin.");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      businessName: formData.get("businessName") || null,
    };
    if (inviteToken) data.inviteToken = inviteToken;

    // reCAPTCHA token (client-side) — global grecaptcha varsa getToken
    const grecaptcha = (window as unknown as { grecaptcha?: { ready: (fn: () => void) => void; execute: (siteKey: string, opts: { action: string }) => Promise<string> } }).grecaptcha;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (grecaptcha && siteKey) {
      try {
        const token = await new Promise<string>((resolve) => {
          grecaptcha.ready(() => {
            grecaptcha
              .execute(siteKey, { action: "register" })
              .then(resolve)
              .catch(() => resolve(""));
          });
        });
        if (token) data.recaptchaToken = token;
      } catch {
        // ignore, server fail-open
      }
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error || "Kayıt başarısız, lütfen tekrar deneyin.");
      return;
    }

    if (result.requiresVerification) {
      setEmailSent(String(data.email));
      return;
    }
    // Invite yoluyla kayıt olan (zaten verified)
    router.push("/login?registered=true");
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <Mail size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            E-postanı kontrol et
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            <strong className="text-gray-900">{emailSent}</strong> adresine
            doğrulama bağlantısı gönderdik. Bağlantıya tıklayarak hesabını
            aktive et.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            E-posta gelmediyse spam klasörünü kontrol et veya{" "}
            <Link href="/register" className="text-green-600 underline">
              tekrar dene
            </Link>
            .
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm text-green-600 hover:underline"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">WaSend</h1>
          <p className="text-gray-500 mt-2">
            {inviteToken ? "Ekip davetini kabul et" : "14 günlük ücretsiz deneme"}
          </p>
          {inviteToken && (
            <p className="text-xs text-gray-400 mt-1">
              Rol davetinizle birlikte atanacak.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label
              htmlFor="reg-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ad Soyad
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Ahmet Yılmaz"
            />
          </div>

          <div>
            <label
              htmlFor="reg-business"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              İşletme Adı <span className="text-gray-400 text-xs">(opsiyonel)</span>
            </label>
            <input
              id="reg-business"
              name="businessName"
              type="text"
              autoComplete="organization"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Güzellik Salonu X"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-posta
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Şifre
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="En az 8 karakter"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span>
              <Link href="/terms" className="underline hover:text-gray-900" target="_blank">
                Kullanım Şartları
              </Link>
              &apos;nı ve{" "}
              <Link href="/privacy" className="underline hover:text-gray-900" target="_blank">
                Gizlilik Politikası
              </Link>
              &apos;nı okudum, kişisel verilerimin KVKK kapsamında işlenmesine açık rıza veriyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Kayıt yapılıyor..." : inviteToken ? "Daveti Kabul Et" : "Ücretsiz Başla"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Hesabın var mı?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Yükleniyor...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
