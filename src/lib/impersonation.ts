import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Super admin "impersonate as" — bir tenant'ın hesabına kontrollü geçici erişim.
 *
 * - HttpOnly + signed cookie (HMAC-SHA256 / NEXTAUTH_SECRET)
 * - IP binding: cookie set edilirken client IP hash'i token'a gömülür.
 *   Okurken aynı IP geliyor mu doğrulanır. Çalınan cookie farklı bir IP'den
 *   kullanılamaz (VPN/NAT senaryolarında bile /16 subnet'e sadeleştirilir).
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

/**
 * Request IP'sini header'lardan çek. Next.js app router'da `headers()`
 * kullanılır. X-Forwarded-For (reverse proxy) → X-Real-IP → fallback "unknown".
 * IPv4 için /16'ya (ilk 2 octet), IPv6 için /48'e indir — mobil hücre geçişi,
 * WiFi→LTE switch, carrier NAT gibi yaygın IP değişikliklerine tolerans.
 */
async function getClientIpHash(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for") || "";
  const xri = h.get("x-real-ip") || "";
  const raw = (xff.split(",")[0] || xri || "unknown").trim();

  let bucket = raw;
  if (raw.includes(":")) {
    // IPv6 — ilk 3 grubu al
    bucket = raw.split(":").slice(0, 3).join(":");
  } else if (raw.includes(".")) {
    // IPv4 — ilk 2 octet
    bucket = raw.split(".").slice(0, 2).join(".");
  }
  return createHmac("sha256", secret()).update(bucket).digest("hex").slice(0, 16);
}

export function encodeImpersonationToken(userId: string, ipHash: string): string {
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}.${ipHash}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeImpersonationToken(
  token: string,
  currentIpHash: string,
): { userId: string; issuedAt: number } | null {
  const parts = token.split(".");

  // Backwards-compat: eski 3-parçalı cookie (IP binding öncesi) reddet —
  // admin yeniden impersonate başlatsın. Güvenli default.
  if (parts.length !== 4) return null;

  const [userId, tsStr, ipHash, sig] = parts;
  if (!userId || !tsStr || !ipHash || !sig) return null;

  const expected = sign(`${userId}.${tsStr}.${ipHash}`);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  const issuedAt = Number(tsStr);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > MAX_AGE_MS) return null;

  // IP binding — farklı /16 subnet'ten geliyorsa cookie geçersiz.
  const currBuf = Buffer.from(currentIpHash, "hex");
  const storedBuf = Buffer.from(ipHash, "hex");
  if (currBuf.length !== storedBuf.length) return null;
  if (!timingSafeEqual(currBuf, storedBuf)) return null;

  return { userId, issuedAt };
}

export async function readImpersonationCookie(): Promise<
  { userId: string; issuedAt: number } | null
> {
  const store = await cookies();
  const raw = store.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  const currentIpHash = await getClientIpHash();
  return decodeImpersonationToken(raw, currentIpHash);
}

export async function setImpersonationCookie(userId: string): Promise<void> {
  const ipHash = await getClientIpHash();
  const token = encodeImpersonationToken(userId, ipHash);
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
