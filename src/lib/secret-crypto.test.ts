import { describe, expect, it, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "./secret-crypto";

beforeAll(() => {
  // Test'ler için deterministik bir secret
  process.env.NEXTAUTH_SECRET = "test-nextauth-secret-min-16-chars-long";
});

describe("secret-crypto", () => {
  it("round-trips an ascii plaintext", () => {
    const plain = "EAABwzLixnjYBO1abc123XYZ";
    const enc = encryptSecret(plain);
    expect(enc).toBeTruthy();
    expect(enc).not.toBe(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("produces different ciphertext for same plaintext (IV randomness)", () => {
    const plain = "same-value-every-time";
    const a = encryptSecret(plain);
    const b = encryptSecret(plain);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(plain);
    expect(decryptSecret(b)).toBe(plain);
  });

  it("returns null for empty / null input", () => {
    expect(encryptSecret(null)).toBeNull();
    expect(encryptSecret(undefined)).toBeNull();
    expect(encryptSecret("")).toBeNull();
    expect(decryptSecret(null)).toBeNull();
    expect(decryptSecret("")).toBeNull();
  });

  it("returns null for tampered ciphertext", () => {
    const enc = encryptSecret("original");
    // flip a byte in the middle
    const buf = Buffer.from(enc!, "base64");
    buf[20] = buf[20] ^ 1;
    const tampered = buf.toString("base64");
    expect(decryptSecret(tampered)).toBeNull();
  });

  it("returns null for garbage", () => {
    expect(decryptSecret("this-is-not-valid-base64-ciphertext")).toBeNull();
    expect(decryptSecret("AAAA")).toBeNull();
  });

  it("handles UTF-8 (non-ASCII) plaintext", () => {
    const plain = "Merhaba dünya! 🇹🇷 Özgür veri akışı";
    const enc = encryptSecret(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });
});
