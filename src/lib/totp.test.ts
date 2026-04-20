import { describe, it, expect } from "vitest";
import { authenticator } from "otplib";
import { generateSecret, verifyToken } from "./totp";

describe("totp", () => {
  it("generates a valid base32 secret", () => {
    const s = generateSecret();
    expect(s).toMatch(/^[A-Z2-7]+$/);
    expect(s.length).toBeGreaterThanOrEqual(16);
  });

  it("verifies a current token", () => {
    const secret = generateSecret();
    const token = authenticator.generate(secret);
    expect(verifyToken(token, secret)).toBe(true);
  });

  it("rejects wrong token", () => {
    const secret = generateSecret();
    expect(verifyToken("000000", secret)).toBe(false);
  });

  it("rejects non-6-digit input", () => {
    const secret = generateSecret();
    expect(verifyToken("12345", secret)).toBe(false);
    expect(verifyToken("abcdef", secret)).toBe(false);
    expect(verifyToken("", secret)).toBe(false);
  });

  it("tolerates whitespace", () => {
    const secret = generateSecret();
    const token = authenticator.generate(secret);
    const withSpaces = `${token.slice(0, 3)} ${token.slice(3)}`;
    expect(verifyToken(withSpaces, secret)).toBe(true);
  });
});
