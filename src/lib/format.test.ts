import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
} from "./format";

describe("formatCurrency", () => {
  it("formats TRY by default (tr)", () => {
    const out = formatCurrency(1234.5);
    expect(out).toMatch(/1\.234,50/);
    expect(out).toMatch(/₺/);
  });

  it("formats USD for en locale", () => {
    const out = formatCurrency(1234.5, { locale: "en" });
    expect(out).toMatch(/\$/);
  });

  it("respects currency override", () => {
    const out = formatCurrency(10, { locale: "en", currency: "EUR" });
    expect(out).toMatch(/€|EUR/);
  });
});

describe("formatNumber", () => {
  it("uses tr-TR thousands separator", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("uses en-US thousands separator", () => {
    expect(formatNumber(1234567, { locale: "en" })).toBe("1,234,567");
  });
});

describe("formatDate", () => {
  it("returns a non-empty string", () => {
    const out = formatDate(new Date("2026-04-20T10:00:00Z"));
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("formatRelativeTime", () => {
  it("formats seconds", () => {
    const now = Date.now();
    const out = formatRelativeTime(now - 5000, { now });
    expect(out.length).toBeGreaterThan(0);
  });

  it("formats days", () => {
    const now = Date.now();
    const out = formatRelativeTime(now - 3 * 86400000, { now });
    expect(out.length).toBeGreaterThan(0);
  });
});
