import { describe, it, expect } from "vitest";
import { generate } from "otplib";
import { generateSecret, verifyToken } from "./totp";

describe("totp", () => {
  it("generates a valid base32 secret", () => {
    const s = generateSecret();
    expect(s).toMatch(/^[A-Z2-7]+$/);
    expect(s.length).toBeGreaterThanOrEqual(16);
  });

  it("verifies a current token", async () => {
    const secret = generateSecret();
    const token = await generate({ secret });
    await expect(verifyToken(token, secret)).resolves.toBe(true);
  });

  it("rejects wrong token", async () => {
    const secret = generateSecret();
    await expect(verifyToken("000000", secret)).resolves.toBe(false);
  });

  it("rejects non-6-digit input", async () => {
    const secret = generateSecret();
    await expect(verifyToken("12345", secret)).resolves.toBe(false);
    await expect(verifyToken("abcdef", secret)).resolves.toBe(false);
    await expect(verifyToken("", secret)).resolves.toBe(false);
  });

  it("tolerates whitespace", async () => {
    const secret = generateSecret();
    const token = await generate({ secret });
    const withSpaces = `${token.slice(0, 3)} ${token.slice(3)}`;
    await expect(verifyToken(withSpaces, secret)).resolves.toBe(true);
  });
});
