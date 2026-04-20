import { authenticator } from "otplib";
import QRCode from "qrcode";

/**
 * Admin TOTP (Google Authenticator / 1Password) yardımcıları.
 * otplib RFC 6238 standardını kullanır, 30 saniyelik pencereler.
 */

authenticator.options = { window: 1 }; // ±1 pencere (60s tolerance) — saat kayması için

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function verifyToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    return authenticator.verify({ token: clean, secret });
  } catch {
    return false;
  }
}

export async function otpauthUrl(
  email: string,
  secret: string,
  issuer = "WaSend Admin",
): Promise<string> {
  return authenticator.keyuri(email, issuer, secret);
}

export async function qrDataUrl(otpauth: string): Promise<string> {
  return QRCode.toDataURL(otpauth, { width: 240, margin: 1 });
}
