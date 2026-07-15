import {
  generateSecret as createSecret,
  generateURI,
  verify,
} from "otplib";
import QRCode from "qrcode";

/**
 * Admin TOTP (Google Authenticator / 1Password) yardımcıları.
 * otplib RFC 6238 standardını kullanır, 30 saniyelik pencereler.
 */

export function generateSecret(): string {
  return createSecret();
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    const result = await verify({
      token: clean,
      secret,
      epochTolerance: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export async function otpauthUrl(
  email: string,
  secret: string,
  issuer = "WaSend Admin",
): Promise<string> {
  return generateURI({ issuer, label: email, secret });
}

export async function qrDataUrl(otpauth: string): Promise<string> {
  return QRCode.toDataURL(otpauth, { width: 240, margin: 1 });
}
