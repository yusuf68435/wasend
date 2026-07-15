import { describe, expect, it } from "vitest";
import { getTrustedClientIp } from "./client-ip";

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe("getTrustedClientIp", () => {
  it("prefers the reverse proxy supplied X-Real-IP", () => {
    expect(
      getTrustedClientIp(
        headers({
          "x-real-ip": "203.0.113.8",
          "x-forwarded-for": "198.51.100.4, 192.0.2.9",
        }),
      ),
    ).toBe("203.0.113.8");
  });

  it("uses the nearest forwarded address instead of a spoofable first value", () => {
    expect(
      getTrustedClientIp(
        headers({ "x-forwarded-for": "attacker-value, 198.51.100.7" }),
      ),
    ).toBe("198.51.100.7");
  });

  it("returns null when no client address is available", () => {
    expect(getTrustedClientIp(headers({}))).toBeNull();
  });
});
