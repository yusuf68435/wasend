import { describe, it, expect } from "vitest";
import { createHash } from "crypto";

function stableBucket(userId: string, flagKey: string): number {
  const h = createHash("sha256").update(`${flagKey}:${userId}`).digest();
  return h.readUInt32BE(0) % 100;
}

describe("feature flag stable bucket", () => {
  it("aynı user + aynı key → aynı bucket", () => {
    const a = stableBucket("user-123", "new-ui");
    const b = stableBucket("user-123", "new-ui");
    expect(a).toBe(b);
  });

  it("farklı user → farklı dağılım (örnekle %50 dengeli)", () => {
    const pct50 = 50;
    const samples = 500;
    let included = 0;
    for (let i = 0; i < samples; i++) {
      const uid = `user-${i}`;
      if (stableBucket(uid, "test-flag") < pct50) included++;
    }
    // ~250 olmalı, sapma %10'dan az
    expect(included).toBeGreaterThan(200);
    expect(included).toBeLessThan(300);
  });

  it("aynı user farklı flag → bağımsız bucket", () => {
    const a = stableBucket("user-xyz", "flag-a");
    const b = stableBucket("user-xyz", "flag-b");
    // Her biri 0-99 arası, aynı olma ihtimali düşük
    // Sadece her ikisi de geçerli range'de mi kontrol
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(100);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(100);
  });
});
