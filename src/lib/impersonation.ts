import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Super admin "impersonate as" — bir tenant'ın hesabına kontrollü geçici erişim.
 *
 * - HttpOnly + signed cookie (HMAC-SHA256 / NEXTAUTH_SECRET)
 * - Her API çağrısında requireUserId() admin olup olmadığını JWT'den kontrol eder;
 *   sadece JWT'de isSuperAdmin=true olanlar için cookie etkili olur.
 * - Max 2 saat TTL.
 * - Tüm başlatma/durdurma işlemleri adminAuditLog'a yazılır.
 */

export const IMPERSONATION_COOKIE = "wasend_impersonate_as";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET eksik");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function encodeImpersonationToken(userId: string): string {
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeImpersonationToken(
  token: string,
): { userId: string; issuedAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, tsStr, sig] = parts;
  if (!userId || !tsStr || !sig) return null;

  const expected = sign(`${userId}.${tsStr}`);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  const issuedAt = Number(tsStr);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > MAX_AGE_MS) return null;

  return { userId, issuedAt };
}

export async function readImpersonationCookie(): Promise<
  { userId: string; issuedAt: number } | null
> {
  const store = await cookies();
  const raw = store.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  return decodeImpersonationToken(raw);
}

export async function setImpersonationCookie(userId: string): Promise<void> {
  const token = encodeImpersonationToken(userId);
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function clearImpersonationCookie(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
}
