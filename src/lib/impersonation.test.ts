import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "crypto";
import { encodeImpersonationToken, decodeImpersonationToken } from "./impersonation";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-impersonation";
});

const IP = "abcd1234abcd1234";
const OTHER_IP = "ffffffffffffffff";

describe("impersonation token", () => {
  it("encodes and decodes same userId with matching IP", () => {
    const token = encodeImpersonationToken("user-123", IP);
    const decoded = decodeImpersonationToken(token, IP);
    expect(decoded?.userId).toBe("user-123");
  });

  it("rejects tampered userId", () => {
    const token = encodeImpersonationToken("user-123", IP);
    const parts = token.split(".");
    const tampered = ["user-999", parts[1], parts[2], parts[3]].join(".");
    expect(decodeImpersonationToken(tampered, IP)).toBeNull();
  });

  it("rejects tampered signature", () => {
    const token = encodeImpersonationToken("user-123", IP);
    const parts = token.split(".");
    const tampered = [parts[0], parts[1], parts[2], "deadbeef"].join(".");
    expect(decodeImpersonationToken(tampered, IP)).toBeNull();
  });

  it("rejects malformed token", () => {
    expect(decodeImpersonationToken("not-a-token", IP)).toBeNull();
    expect(decodeImpersonationToken("a.b", IP)).toBeNull();
    expect(decodeImpersonationToken("", IP)).toBeNull();
  });

  it("rejects expired token", () => {
    const expiredTs = Date.now() - 3 * 60 * 60 * 1000;
    const payload = `user-123.${expiredTs}.${IP}`;
    const sig = createHmac("sha256", process.env.NEXTAUTH_SECRET!)
      .update(payload)
      .digest("hex");
    const token = `${payload}.${sig}`;
    expect(decodeImpersonationToken(token, IP)).toBeNull();
  });

  it("rejects cookie from different IP (/16 subnet mismatch)", () => {
    const token = encodeImpersonationToken("user-123", IP);
    expect(decodeImpersonationToken(token, OTHER_IP)).toBeNull();
  });

  it("rejects legacy 3-part token without IP binding", () => {
    const payload = `user-123.${Date.now()}`;
    const sig = createHmac("sha256", process.env.NEXTAUTH_SECRET!)
      .update(payload)
      .digest("hex");
    const legacyToken = `${payload}.${sig}`;
    expect(decodeImpersonationToken(legacyToken, IP)).toBeNull();
  });
});
