import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { signTotpCookie, verifyTotpCookie } from "./admin-totp-gate";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-admin-totp-cookie";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("admin TOTP gate cookie", () => {
  it("accepts a current signed cookie for the same user", () => {
    const token = signTotpCookie("admin-1");
    expect(verifyTotpCookie(token, "admin-1")).toBe(true);
  });

  it("rejects a cookie for a different user", () => {
    const token = signTotpCookie("admin-1");
    expect(verifyTotpCookie(token, "admin-2")).toBe(false);
  });

  it("rejects expired cookies", () => {
    const issuedAt = new Date("2026-07-15T10:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(issuedAt);
    const token = signTotpCookie("admin-1");
    vi.setSystemTime(new Date(issuedAt.getTime() + 2 * 60 * 60 * 1000 + 1));
    expect(verifyTotpCookie(token, "admin-1")).toBe(false);
  });

  it("rejects cookies issued implausibly far in the future", () => {
    const now = new Date("2026-07-15T10:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now.getTime() + 5 * 60 * 1000));
    const token = signTotpCookie("admin-1");
    vi.setSystemTime(now);
    expect(verifyTotpCookie(token, "admin-1")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = signTotpCookie("admin-1");
    expect(verifyTotpCookie(`${token.slice(0, -1)}0`, "admin-1")).toBe(false);
  });
});
