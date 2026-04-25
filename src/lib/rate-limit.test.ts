import { describe, it, expect } from "vitest";
import {
  checkRateLimit,
  checkApiKeyRateLimit,
  apiKeyRateLimitHeaders,
} from "./rate-limit";

describe("checkRateLimit", () => {
  it("ilk N istekte allowed=true, kalan azalır", () => {
    const key = "rl:test:" + Math.random();
    const a = checkRateLimit(key, 3, 60_000);
    expect(a.allowed).toBe(true);
    expect(a.remaining).toBe(2);
    const b = checkRateLimit(key, 3, 60_000);
    expect(b.allowed).toBe(true);
    expect(b.remaining).toBe(1);
    const c = checkRateLimit(key, 3, 60_000);
    expect(c.allowed).toBe(true);
    expect(c.remaining).toBe(0);
    const d = checkRateLimit(key, 3, 60_000);
    expect(d.allowed).toBe(false);
    expect(d.remaining).toBe(0);
  });
});

describe("checkApiKeyRateLimit", () => {
  it("varsayılan 60 rpm — 60. istekte hala allowed, 61.'de değil", () => {
    const keyId = "k:" + Math.random();
    let last;
    for (let i = 0; i < 60; i++) {
      last = checkApiKeyRateLimit(keyId);
      expect(last.allowed).toBe(true);
    }
    expect(last!.remaining).toBe(0);
    const blocked = checkApiKeyRateLimit(keyId);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it("rpm override edilebilir", () => {
    const keyId = "k2:" + Math.random();
    const a = checkApiKeyRateLimit(keyId, { rpm: 2 });
    expect(a.limit).toBe(2);
    expect(a.allowed).toBe(true);
    const b = checkApiKeyRateLimit(keyId, { rpm: 2 });
    expect(b.allowed).toBe(true);
    const c = checkApiKeyRateLimit(keyId, { rpm: 2 });
    expect(c.allowed).toBe(false);
  });
});

describe("apiKeyRateLimitHeaders", () => {
  it("allowed durumunda Retry-After yok", () => {
    const keyId = "k3:" + Math.random();
    const r = checkApiKeyRateLimit(keyId);
    const h = apiKeyRateLimitHeaders(r);
    expect(h["X-RateLimit-Limit"]).toBe("60");
    expect(h["Retry-After"]).toBeUndefined();
  });

  it("blocked durumunda Retry-After var", () => {
    const keyId = "k4:" + Math.random();
    let r;
    for (let i = 0; i < 61; i++) r = checkApiKeyRateLimit(keyId);
    const h = apiKeyRateLimitHeaders(r!);
    expect(h["Retry-After"]).toBeDefined();
    expect(Number(h["Retry-After"])).toBeGreaterThanOrEqual(1);
  });
});
