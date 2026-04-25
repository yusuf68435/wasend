import { describe, expect, it } from "vitest";
import {
  MAX_RETRY_ATTEMPTS,
  computeNextRetryAt,
  decideRetry,
  isRetryableError,
} from "./message-retry";

describe("isRetryableError", () => {
  it("treats 5xx and 429 as retryable", () => {
    expect(isRetryableError("HTTP 500 Internal Server Error")).toBe(true);
    expect(isRetryableError("HTTP 502 Bad Gateway")).toBe(true);
    expect(isRetryableError("HTTP 503 Service Unavailable")).toBe(true);
    expect(isRetryableError("HTTP 429 Too Many Requests")).toBe(true);
  });

  it("treats network-class errors as retryable", () => {
    expect(isRetryableError("fetch failed")).toBe(true);
    expect(isRetryableError("ECONNRESET")).toBe(true);
    expect(isRetryableError("ETIMEDOUT")).toBe(true);
    expect(isRetryableError("Request timeout after 30s")).toBe(true);
    expect(isRetryableError("Rate limit exceeded, try again")).toBe(true);
  });

  it("treats auth/permission errors as permanent", () => {
    expect(isRetryableError("HTTP 401 Unauthorized")).toBe(false);
    expect(isRetryableError("HTTP 403 Forbidden")).toBe(false);
    expect(isRetryableError("HTTP 400 Bad Request")).toBe(false);
    expect(isRetryableError("Invalid OAuth token")).toBe(false);
    expect(isRetryableError("Permission denied for this WABA")).toBe(false);
    expect(isRetryableError("Code: 190 - access token expired")).toBe(false);
  });

  it("treats invalid recipient errors as permanent", () => {
    expect(isRetryableError("Recipient phone is invalid")).toBe(false);
    expect(isRetryableError("phone number malformed")).toBe(false);
  });

  it("defaults to retryable for ambiguous reasons", () => {
    expect(isRetryableError("Something went wrong")).toBe(true);
    expect(isRetryableError("")).toBe(true);
  });
});

describe("computeNextRetryAt", () => {
  it("returns null when max attempts reached", () => {
    expect(computeNextRetryAt(MAX_RETRY_ATTEMPTS)).toBeNull();
    expect(computeNextRetryAt(MAX_RETRY_ATTEMPTS + 1)).toBeNull();
  });

  it("returns increasing delays for higher retry counts", () => {
    const now = new Date(2026, 0, 1);
    // Run multiple times to average out jitter
    let last = 0;
    for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
      const samples = Array.from({ length: 50 }, () =>
        computeNextRetryAt(i, now),
      );
      const avgMs =
        samples
          .filter((d): d is Date => d !== null)
          .reduce((sum, d) => sum + (d.getTime() - now.getTime()), 0) /
        samples.length;
      expect(avgMs).toBeGreaterThan(last);
      last = avgMs;
    }
  });

  it("first retry is around 1 minute", () => {
    const now = new Date(2026, 0, 1);
    const next = computeNextRetryAt(0, now);
    expect(next).not.toBeNull();
    const delayMs = next!.getTime() - now.getTime();
    // 60s ± 20% jitter
    expect(delayMs).toBeGreaterThan(40_000);
    expect(delayMs).toBeLessThan(80_000);
  });
});

describe("decideRetry", () => {
  it("permanent errors → failed immediately", () => {
    const d = decideRetry(0, "HTTP 401 Unauthorized");
    expect(d.status).toBe("failed");
    expect(d.permanent).toBe(true);
    expect(d.nextRetryAt).toBeNull();
  });

  it("transient error on first failure → retry_pending", () => {
    const d = decideRetry(0, "HTTP 503 Service Unavailable");
    expect(d.status).toBe("retry_pending");
    expect(d.retryCount).toBe(1);
    expect(d.permanent).toBe(false);
    expect(d.nextRetryAt).not.toBeNull();
  });

  it("transient error at max retries → failed (non-permanent)", () => {
    const d = decideRetry(MAX_RETRY_ATTEMPTS - 1, "HTTP 500");
    expect(d.status).toBe("failed");
    expect(d.retryCount).toBe(MAX_RETRY_ATTEMPTS);
    expect(d.permanent).toBe(false);
    expect(d.nextRetryAt).toBeNull();
  });

  it("each retry increments retryCount", () => {
    let count = 0;
    for (let i = 0; i < MAX_RETRY_ATTEMPTS - 1; i++) {
      const d = decideRetry(count, "HTTP 503");
      expect(d.status).toBe("retry_pending");
      count = d.retryCount;
    }
    expect(count).toBe(MAX_RETRY_ATTEMPTS - 1);
    // Final attempt
    const final = decideRetry(count, "HTTP 503");
    expect(final.status).toBe("failed");
  });
});
