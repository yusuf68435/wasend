import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * TOTP gate cookie — admin 2FA'yı bu session'da geçti mi?
 * 2 saat TTL. Daha önce 12 saat'ti ama super-admin cookie'si 2FA atlatma
 * penceresini gereksiz uzun tutuyordu (çalınmış cookie + impersonation =
 * tam tenant erişimi). 2 saat tipik bir admin iş oturumunu karşılar,
 * laptop çalınma senaryosunda risk penceresini 6× azaltır.
 *
 * Signed HMAC (NEXTAUTH_SECRET). User.id'ye bağlı — başka user'a geçersiz.
 */

const COOKIE_NAME = "wasend_admin_2fa";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET eksik");
  return s;
}

export function signTotpCookie(userId: string): string {
  const ts = Date.now();
  const payload = `${userId}.${ts}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyTotpCookie(raw: string, userId: string): boolean {
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [uid, tsStr, sig] = parts;
  if (uid !== userId) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  if (Date.now() - ts > MAX_AGE_MS) return false;
  const expected = createHmac("sha256", secret()).update(`${uid}.${tsStr}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setTotpCookie(userId: string): Promise<void> {
  const value = signTotpCookie(userId);
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function clearTotpCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function hasValidTotpCookie(userId: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  return verifyTotpCookie(raw, userId);
}
