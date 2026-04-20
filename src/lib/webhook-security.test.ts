import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyMetaSignature } from "./webhook-security";

const secret = "test-app-secret-12345678901234567890";

function signBody(body: string, s = secret): string {
  return "sha256=" + crypto.createHmac("sha256", s).update(body).digest("hex");
}

describe("verifyMetaSignature", () => {
  const body = JSON.stringify({ entry: [{ changes: [] }] });

  it("doğru imzayı kabul eder", () => {
    const sig = signBody(body);
    expect(verifyMetaSignature(body, sig, secret)).toBe(true);
  });

  it("yanlış imzayı reddeder", () => {
    expect(verifyMetaSignature(body, "sha256=wrongwrong", secret)).toBe(false);
  });

  it("imza header yoksa false", () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
    expect(verifyMetaSignature(body, "", secret)).toBe(false);
  });

  it("secret yoksa false", () => {
    expect(verifyMetaSignature(body, signBody(body), "")).toBe(false);
  });

  it("body manipule edilmişse false (imza geçmez)", () => {
    const sig = signBody(body);
    expect(verifyMetaSignature(body + "modified", sig, secret)).toBe(false);
  });

  it("farklı secret ile imzalanmış → false", () => {
    const sig = signBody(body, "other-secret-xx");
    expect(verifyMetaSignature(body, sig, secret)).toBe(false);
  });
});
