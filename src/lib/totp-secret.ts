import { decryptSecret, encryptSecret } from "@/lib/secret-crypto";

const BASE32_SECRET = /^[A-Z2-7]{16,256}$/;

export interface DecodedTotpSecret {
  secret: string;
  needsMigration: boolean;
}

export function encodeTotpSecret(secret: string): string {
  if (!BASE32_SECRET.test(secret)) {
    throw new Error("Geçersiz TOTP secret formatı");
  }
  const encrypted = encryptSecret(secret);
  if (!encrypted) throw new Error("TOTP secret şifrelenemedi");
  return encrypted;
}

/**
 * Encrypted secrets are preferred. Legacy plaintext Base32 values remain
 * readable and are opportunistically migrated after a successful check.
 */
export function decodeTotpSecret(
  stored: string | null | undefined,
): DecodedTotpSecret | null {
  if (!stored) return null;

  const decrypted = decryptSecret(stored);
  if (decrypted && BASE32_SECRET.test(decrypted)) {
    return { secret: decrypted, needsMigration: false };
  }

  if (BASE32_SECRET.test(stored)) {
    return { secret: stored, needsMigration: true };
  }
  return null;
}
