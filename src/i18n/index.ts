/**
 * Hafif i18n altyapısı — şimdilik hiçbir UI'da kullanılmıyor.
 *
 * Amaç: Türkiye-odaklı MVP'yi yavaşlatmadan ileride EN/AR/DE eklemeyi ucuz hale
 * getirmek. Yeni string yazarken `t("module.key")` şeklinde kullanılabilir;
 * mevcut hardcoded TR stringler zamanla migration ile buraya taşınır.
 *
 * Locale seçimi:
 *   1. `resolveLocale(userLocale)` — user.locale DB alanından (ileride)
 *   2. Yoksa DEFAULT_LOCALE ("tr")
 *   3. Hiç bulunmazsa key'in kendisi döner (güvenli fallback)
 */

import tr from "./locales/tr.json";
import en from "./locales/en.json";

export const SUPPORTED_LOCALES = ["tr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";

const DICTIONARIES: Record<Locale, Record<string, unknown>> = {
  tr,
  en,
};

export function resolveLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase().slice(0, 2);
  return SUPPORTED_LOCALES.includes(lower as Locale)
    ? (lower as Locale)
    : DEFAULT_LOCALE;
}

function getByPath(obj: Record<string, unknown>, path: string): string | null {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return null;
    }
  }
  return typeof cur === "string" ? cur : null;
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

/**
 * Translate a dotted key. Örn:
 *   t("common.save") → "Kaydet"
 *   t("plan.limitReached", undefined, "en") → "Plan limit reached"
 *   t("contacts.count", { n: 42 }) → "42 kişi" (varsa)
 *
 * Eksik key bulunamazsa key'in kendisi döner. Böylece eklemeyi unutsan bile
 * UI kırılmaz — key ekrana düşünce görsel olarak hemen fark edilir.
 */
export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const found = getByPath(dict, key);
  if (found) return interpolate(found, vars);

  if (locale !== DEFAULT_LOCALE) {
    const fallback = getByPath(DICTIONARIES[DEFAULT_LOCALE], key);
    if (fallback) return interpolate(fallback, vars);
  }
  return key;
}

export function translator(locale: Locale = DEFAULT_LOCALE) {
  return (key: string, vars?: Record<string, string | number>) =>
    t(key, vars, locale);
}
