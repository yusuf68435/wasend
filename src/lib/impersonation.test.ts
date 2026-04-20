import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "crypto";
import { encodeImpersonationToken, decodeImpersonationToken } from "./impersonation";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-impersonation";
});

describe("impersonation token", () => {
  it("encodes and decodes same userId", () => {
    const token = encodeImpersonationToken("user-123");
    const decoded = decodeImpersonationToken(token);
    expect(decoded?.userId).toBe("user-123");
  });

  it("rejects tampered userId", () => {
    const token = encodeImpersonationToken("user-123");
    const parts = token.split(".");
    const tampered = ["user-999", parts[1], parts[2]].join(".");
    expect(decodeImpersonationToken(tampered)).toBeNull();
  });

  it("rejects tampered signature", () => {
    const token = encodeImpersonationToken("user-123");
    const parts = token.split(".");
    const tampered = [parts[0], parts[1], "deadbeef"].join(".");
    expect(decodeImpersonationToken(tampered)).toBeNull();
  });

  it("rejects malformed token", () => {
    expect(decodeImpersonationToken("not-a-token")).toBeNull();
    expect(decodeImpersonationToken("a.b")).toBeNull();
    expect(decodeImpersonationToken("")).toBeNull();
  });

  it("rejects expired token", () => {
    const expiredTs = Date.now() - 3 * 60 * 60 * 1000;
    const payload = `user-123.${expiredTs}`;
    const sig = createHmac("sha256", process.env.NEXTAUTH_SECRET!)
      .update(payload)
      .digest("hex");
    const token = `${payload}.${sig}`;
    expect(decodeImpersonationToken(token)).toBeNull();
  });
});
