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
    const grecaptcha = (
      window as unknown as {
        grecaptcha?: {
          ready: (fn: () => void) => void;
          execute: (
            siteKey: string,
            opts: { action: string },
          ) => Promise<string>;
        };
      }
    ).grecaptcha;
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
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
            <Mail size={24} strokeWidth={1.75} className="text-[#1d1d1f]" />
          </div>
          <h1 className="display-md text-[#1d1d1f]">E-postanı kontrol et.</h1>
          <p className="text-[15px] text-[#6e6e73] mt-4 tracking-tight">
            <strong className="text-[#1d1d1f] font-medium">{emailSent}</strong>{" "}
            adresine doğrulama bağlantısı gönderdik. Bağlantıya tıklayarak
            hesabını aktive et.
          </p>
          <p className="text-[12px] text-[#86868b] mt-6 tracking-tight">
            E-posta gelmediyse spam klasörünü kontrol et veya{" "}
            <Link
              href="/register"
              className="text-[#1d1d1f] underline underline-offset-4"
            >
              tekrar dene
            </Link>
            .
          </p>
          <Link
            href="/login"
            className="inline-block mt-8 text-[13px] text-[#1d1d1f] hover:underline underline-offset-4 tracking-tight"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#1d1d1f] px-4 py-12">
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
          <h1 className="display-md mt-8 text-[#1d1d1f]">
            {inviteToken ? "Davete katıl." : "Ücretsiz başla."}
          </h1>
          <p className="text-[15px] text-[#6e6e73] mt-2 tracking-tight">
            {inviteToken
              ? "Rol davetinle birlikte atanacak."
              : "14 gün deneme. Kredi kartı istenmiyor."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#ff453a]/10 text-[#ff453a] px-4 py-3 rounded-2xl text-[13px] tracking-tight">
              {error}
            </div>
          )}

          <Field
            id="reg-name"
            name="name"
            type="text"
            label="Ad Soyad"
            autoComplete="name"
            placeholder="Ahmet Yılmaz"
            required
          />
          <Field
            id="reg-business"
            name="businessName"
            type="text"
            label="İşletme adı"
            optional
            autoComplete="organization"
            placeholder="Güzellik Salonu X"
          />
          <Field
            id="reg-email"
            name="email"
            type="email"
            label="E-posta"
            autoComplete="email"
            placeholder="ornek@email.com"
            required
          />

          <div>
            <label
              htmlFor="reg-password"
              className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5 tracking-tight"
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
              placeholder="En az 8 karakter"
              className="w-full px-4 h-11 bg-white border border-[#d2d2d7] rounded-2xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#1d1d1f] focus:ring-2 focus:ring-[#1d1d1f]/5 outline-none transition"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <label className="flex items-start gap-2.5 text-[12px] text-[#6e6e73] tracking-tight leading-relaxed pt-1">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 rounded border-[#d2d2d7] text-[#1d1d1f] focus:ring-[#1d1d1f]/20"
            />
            <span>
              <Link
                href="/terms"
                className="underline underline-offset-2 text-[#1d1d1f]"
                target="_blank"
              >
                Kullanım Şartları
              </Link>
              &apos;nı ve{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 text-[#1d1d1f]"
                target="_blank"
              >
                Gizlilik Politikası
              </Link>
              &apos;nı okudum, kişisel verilerimin KVKK kapsamında işlenmesine
              açık rıza veriyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full h-11 rounded-full bg-[#1d1d1f] text-white text-[14px] font-medium tracking-tight hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Kayıt yapılıyor…"
              : inviteToken
                ? "Daveti kabul et"
                : "Ücretsiz başla"}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6e6e73] mt-8 tracking-tight">
          Hesabın var mı?{" "}
          <Link
            href="/login"
            className="text-[#1d1d1f] font-medium hover:underline underline-offset-4"
          >
            Giriş yap
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
  optional,
}: {
  id: string;
  name: string;
  type: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5 tracking-tight"
      >
        {label}
        {optional && (
          <span className="text-[11px] text-[#86868b] ml-1.5 font-normal">
            (opsiyonel)
          </span>
        )}
      </label>
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] text-[#6e6e73] text-[13px] tracking-tight">
          Yükleniyor…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
