/**
 * Meta signed_request parser/verifier.
 *
 * Meta'nın çeşitli callback'lerinde (data deletion, ES auth) gönderdiği
 * imzalı payload formatı: `<base64url-signature>.<base64url-payload>`
 * Signature = HMAC-SHA256(payload, app_secret).
 *
 * Doğrulama timing-safe karşılaştırma ile yapılır.
 */
import { createHmac, timingSafeEqual } from "crypto";

export interface SignedRequestPayload {
  user_id: string;
  algorithm: string;
  issued_at?: number;
  expires?: number;
  [key: string]: unknown;
}

export function base64urlDecode(input: string): Buffer {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

export function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * signed_request string'ini parse edip doğrular.
 * Geçersiz format/imza/algoritma → null.
 */
export function parseSignedRequest(
  raw: string,
  secret: string,
): SignedRequestPayload | null {
  if (typeof raw !== "string" || !raw.includes(".")) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [encodedSig, encodedPayload] = parts;
  if (!encodedSig || !encodedPayload) return null;

  let expectedSig: Buffer;
  try {
    expectedSig = base64urlDecode(encodedSig);
  } catch {
    return null;
  }

  const computedSig = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest();

  if (
    expectedSig.length !== computedSig.length ||
    !timingSafeEqual(expectedSig, computedSig)
  ) {
    return null;
  }

  let payload: SignedRequestPayload;
  try {
    const decoded = base64urlDecode(encodedPayload).toString("utf8");
    payload = JSON.parse(decoded) as SignedRequestPayload;
  } catch {
    return null;
  }

  if (payload.algorithm !== "HMAC-SHA256") return null;
  if (typeof payload.user_id !== "string" || payload.user_id.length === 0) {
    return null;
  }
  return payload;
}

/**
 * Test/dev için signed_request üreticisi.
 * Production code yolunda kullanılmaz — sadece test fixture'ı.
 */
export function buildSignedRequest(
  payload: SignedRequestPayload,
  secret: string,
): string {
  const encodedPayload = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", secret).update(encodedPayload).digest();
  const encodedSig = base64urlEncode(sig);
  return `${encodedSig}.${encodedPayload}`;
}
