/**
 * Locale-aware formatlama yardımcıları. Intl API kullanılıyor; şimdilik
 * default tr-TR + TRY. İleride kullanıcı bazlı locale/currency eklenirse
 * tek çağrı noktası olduğu için migration ucuz.
 */

import type { Locale } from "@/i18n";
import { DEFAULT_LOCALE } from "@/i18n";

const LOCALE_TAG: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-US",
};

const DEFAULT_CURRENCY: Record<Locale, string> = {
  tr: "TRY",
  en: "USD",
};

export function formatCurrency(
  amount: number,
  opts?: { locale?: Locale; currency?: string },
): string {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const currency = opts?.currency ?? DEFAULT_CURRENCY[locale];
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatNumber(
  n: number,
  opts?: { locale?: Locale; maximumFractionDigits?: number },
): string {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: opts?.maximumFractionDigits,
  }).format(n);
}

export function formatDate(
  date: Date | string | number,
  opts?: {
    locale?: Locale;
    timezone?: string;
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
  },
): string {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    timeZone: opts?.timezone ?? "Europe/Istanbul",
    dateStyle: opts?.dateStyle ?? "medium",
    timeStyle: opts?.timeStyle,
  }).format(d);
}

export function formatRelativeTime(
  date: Date | string | number,
  opts?: { locale?: Locale; now?: number },
): string {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const rtf = new Intl.RelativeTimeFormat(LOCALE_TAG[locale], {
    numeric: "auto",
  });
  const now = opts?.now ?? Date.now();
  const then = typeof date === "object" ? date.getTime() : new Date(date).getTime();
  const diff = (then - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), "month");
  return rtf.format(Math.round(diff / 31536000), "year");
}
