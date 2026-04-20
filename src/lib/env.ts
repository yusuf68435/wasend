/**
 * Environment doğrulaması — boot-time, fail-fast.
 *
 * Amaç: Prod'da kritik env eksikse uygulamayı HEMEN durdurmak, webhook
 * ilk isteğinde patlamak yerine. Dev'de daha gevşek — eksikler sadece
 * console'a warn olarak yazılır.
 *
 * Kullanım:
 *   import "@/lib/env"; // sadece import etmek validasyonu tetikler
 * veya
 *   import { env } from "@/lib/env"; // tip güvenli erişim
 */

import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

// Required in production. Optional in development.
const prodRequired = (schema: z.ZodString) =>
  isProd ? schema.min(1, "required in production") : schema.optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL zorunlu"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET en az 16 karakter olmalı"),
  NEXTAUTH_URL: isProd
    ? z.string().url("NEXTAUTH_URL geçerli bir URL olmalı")
    : z.string().optional(),

  // Cron — fallback NEXTAUTH_SECRET, bu yüzden opsiyonel
  CRON_SECRET: z.string().optional(),

  // WhatsApp — opsiyonel (eksikse ilgili route'lar 500 döner, app boot eder).
  // Kritik env (DATABASE_URL, NEXTAUTH_SECRET) zorunlu kalır.
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_WABA_ID: z.string().optional(),

  // Opsiyonel servisler — DSN/key yoksa ilgili özellik pasif
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  STRIPE_ENABLED: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),

  // i18n / impersonation / admin — bootstrap
  ADMIN_EMAILS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validate(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    const msg = `❌ Environment doğrulaması başarısız:\n${issues}`;

    if (isProd) {
      // Prod'da fail-fast
      throw new Error(msg);
    } else {
      // Dev'de sadece uyar, programın çalışmasını engelleme
      console.warn(msg);
      // En iyi çaba tip dönüşümü — invalid alanlar undefined kalabilir
      return parsed.data ?? (process.env as unknown as Env);
    }
  }

  // Prod-only üretim uyarıları (opsiyonel servislere dikkat)
  if (isProd) {
    if (!parsed.data.SENTRY_DSN && !parsed.data.NEXT_PUBLIC_SENTRY_DSN) {
      console.warn("⚠️  SENTRY_DSN yok — prod hataları yakalanmıyor");
    }
    if (!parsed.data.RESEND_API_KEY) {
      console.warn("⚠️  RESEND_API_KEY yok — password reset / invite çalışmaz");
    }
  }

  return parsed.data;
}

export const env = validate();
