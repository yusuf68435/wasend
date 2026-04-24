/**
 * At-rest secret encryption — AES-256-GCM.
 *
 * Kullanım senaryosu: Kullanıcı WhatsApp API token'ı gibi hassas veriyi
 * UI'dan giriyor, DB'ye şifreli yazılıyor, kullanırken decrypt ediliyor.
 * Master key NEXTAUTH_SECRET'tan türetilir (HKDF-SHA256 w/ "wasend:secret-v1" salt).
 *
 * Format: base64("v1" | iv(12) | tag(16) | ciphertext)
 *   - Versiyon prefix'i future-proof için (key rotation, algoritma değişimi)
 *   - IV random per-encrypt → aynı plaintext farklı ciphertext üretir
 *   - GCM authentication tag ciphertext'in tampered olup olmadığını doğrular
 *
 * Güvenlik notu: NEXTAUTH_SECRET değişirse mevcut ciphertext'ler decrypt
 * edilemez. Token rotation senaryosu için versioned key scheme gerekir —
 * şimdilik prod'da NEXTAUTH_SECRET immutable kabul ediliyor.
 */

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

const VERSION = "v1";
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const ALGO = "aes-256-gcm";
const SALT = "wasend:secret-v1";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const master = process.env.NEXTAUTH_SECRET;
  if (!master || master.length < 16) {
    throw new Error("NEXTAUTH_SECRET gerekli ve en az 16 karakter olmalı");
  }
  // HKDF-SHA256 → 32 byte encryption key
  const derived = hkdfSync("sha256", master, SALT, "encrypt-user-secret", KEY_LEN);
  cachedKey = Buffer.from(derived);
  return cachedKey;
}

/**
 * Düz metni şifreler ve base64 encoded bir string döner.
 * Boş/null input için null döner (opsiyonel alan kaydı).
 */
export function encryptSecret(plain: string | null | undefined): string | null {
  if (!plain) return null;
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // version prefix + iv + tag + ct
  const out = Buffer.concat([Buffer.from(VERSION, "utf8"), iv, tag, ct]);
  return out.toString("base64");
}

/**
 * base64 ciphertext'i decrypt eder. Hata durumunda (tamper, wrong key,
 * malformed) null döner — throw etmez, böylece caller gracefully
 * fallback edebilir (env'e dönebilir vb).
 */
export function decryptSecret(encoded: string | null | undefined): string | null {
  if (!encoded) return null;
  try {
    const buf = Buffer.from(encoded, "base64");
    const versionBytes = buf.subarray(0, VERSION.length);
    if (versionBytes.toString("utf8") !== VERSION) return null;
    const iv = buf.subarray(VERSION.length, VERSION.length + IV_LEN);
    const tag = buf.subarray(VERSION.length + IV_LEN, VERSION.length + IV_LEN + TAG_LEN);
    const ct = buf.subarray(VERSION.length + IV_LEN + TAG_LEN);
    if (iv.length !== IV_LEN || tag.length !== TAG_LEN) return null;

    const key = getKey();
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

/**
 * UI'ya değer döndürürken "saklanıyor mu?" bilgisini göstermek için
 * kullanılır. Token içeriği asla frontend'e sızdırılmaz — bu helper
 * sadece var-yok bilgisi döner.
 */
export function maskSecret(encoded: string | null | undefined): string {
  if (!encoded) return "";
  return "••••••••";
}
