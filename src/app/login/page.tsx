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
          <h1 className="display-md mt-8 text-[#1d1d1f]">Hoş geldin.</h1>
          <p className="text-[15px] text-[#6e6e73] mt-2 tracking-tight">
            Hesabına giriş yap.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(registered || verified) && (
            <div className="bg-[#30d158]/10 text-[#1d1d1f] px-4 py-3 rounded-2xl text-[13px] flex items-center gap-2 tracking-tight">
              <CheckCircle2
                size={16}
                strokeWidth={2}
                className="text-[#30d158] flex-shrink-0"
              />
              {verified
                ? "E-posta doğrulandı. Giriş yapabilirsin."
                : "Kayıt başarılı. E-postana gönderilen bağlantıyla doğrula, sonra giriş yap."}
            </div>
          )}
          {error && (
            <div className="bg-[#ff453a]/10 text-[#ff453a] px-4 py-3 rounded-2xl text-[13px] tracking-tight">
              {error}
              {error.includes("askıya") && (
                <div className="mt-2 text-[#1d1d1f]">
                  Destek için{" "}
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

          <Field
            id="login-email"
            name="email"
            type="email"
            label="E-posta"
            autoComplete="email"
            placeholder="ornek@email.com"
            required
          />

          <Field
            id="login-password"
            name="password"
            type="password"
            label="Şifre"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            rightLabel={
              <Link
                href="/forgot-password"
                className="text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] tracking-tight"
              >
                Şifremi unuttum
              </Link>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-[#1d1d1f] text-white text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6e6e73] mt-8 tracking-tight">
          Hesabın yok mu?{" "}
          <Link
            href="/register"
            className="text-[#1d1d1f] font-medium hover:underline underline-offset-4"
          >
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  name,
  type,
  label,
  autoComplete,
  placeholder,
  required,
  rightLabel,
}: {
  id: string;
  name: string;
  type: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  rightLabel?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="block text-[13px] font-medium text-[#1d1d1f] tracking-tight"
        >
          {label}
        </label>
        {rightLabel}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full px-4 h-11 bg-white border border-[#d2d2d7] rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#6e6e73] text-[13px] tracking-tight">
          Yükleniyor…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
