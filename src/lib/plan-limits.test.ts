import { describe, it, expect } from "vitest";
import { getLimits, PLAN_LIMITS } from "./plan-limits";

describe("getLimits", () => {
  it("STARTER default", () => {
    const l = getLimits("STARTER");
    expect(l.contactLimit).toBe(500);
    expect(l.priceTry).toBe(499);
  });

  it("PRO", () => {
    const l = getLimits("PRO");
    expect(l.contactLimit).toBe(5000);
    expect(l.broadcastsPerMonth).toBe(100);
  });

  it("BUSINESS", () => {
    const l = getLimits("BUSINESS");
    expect(l.contactLimit).toBe(50000);
    expect(l.flows).toBe(200);
  });

  it("geçersiz plan → STARTER fallback", () => {
    expect(getLimits("RANDOM")).toEqual(PLAN_LIMITS.STARTER);
    expect(getLimits(null)).toEqual(PLAN_LIMITS.STARTER);
    expect(getLimits(undefined)).toEqual(PLAN_LIMITS.STARTER);
  });

  it("tier'lar monoton artar (upgrade incentive)", () => {
    expect(PLAN_LIMITS.PRO.contactLimit).toBeGreaterThan(PLAN_LIMITS.STARTER.contactLimit);
    expect(PLAN_LIMITS.BUSINESS.contactLimit).toBeGreaterThan(PLAN_LIMITS.PRO.contactLimit);
    expect(PLAN_LIMITS.PRO.priceTry).toBeGreaterThan(PLAN_LIMITS.STARTER.priceTry);
    expect(PLAN_LIMITS.BUSINESS.priceTry).toBeGreaterThan(PLAN_LIMITS.PRO.priceTry);
  });
});
