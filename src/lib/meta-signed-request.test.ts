import { describe, expect, it } from "vitest";
import {
  buildSignedRequest,
  parseSignedRequest,
} from "./meta-signed-request";

const SECRET = "test-app-secret-very-secret";

describe("meta-signed-request", () => {
  it("round-trip: build → parse returns same payload", () => {
    const payload = {
      user_id: "1234567890",
      algorithm: "HMAC-SHA256",
      issued_at: 1700000000,
    };
    const raw = buildSignedRequest(payload, SECRET);
    const parsed = parseSignedRequest(raw, SECRET);
    expect(parsed).not.toBeNull();
    expect(parsed?.user_id).toBe("1234567890");
    expect(parsed?.algorithm).toBe("HMAC-SHA256");
    expect(parsed?.issued_at).toBe(1700000000);
  });

  it("returns null for wrong secret (signature mismatch)", () => {
    const raw = buildSignedRequest(
      { user_id: "abc", algorithm: "HMAC-SHA256" },
      SECRET,
    );
    expect(parseSignedRequest(raw, "different-secret")).toBeNull();
  });

  it("returns null for tampered signature", () => {
    const raw = buildSignedRequest(
      { user_id: "abc", algorithm: "HMAC-SHA256" },
      SECRET,
    );
    const [sig, payload] = raw.split(".");
    // Flip last character of sig
    const tampered =
      sig.slice(0, -1) + (sig.slice(-1) === "A" ? "B" : "A") + "." + payload;
    expect(parseSignedRequest(tampered, SECRET)).toBeNull();
  });

  it("returns null for tampered payload", () => {
    const raw = buildSignedRequest(
      { user_id: "abc", algorithm: "HMAC-SHA256" },
      SECRET,
    );
    const [sig, payload] = raw.split(".");
    const tampered =
      sig + "." + payload.slice(0, -1) + (payload.slice(-1) === "A" ? "B" : "A");
    expect(parseSignedRequest(tampered, SECRET)).toBeNull();
  });

  it("returns null for malformed input (no dot)", () => {
    expect(parseSignedRequest("garbage", SECRET)).toBeNull();
    expect(parseSignedRequest("", SECRET)).toBeNull();
  });

  it("returns null for missing user_id", () => {
    const raw = buildSignedRequest(
      { user_id: "", algorithm: "HMAC-SHA256" },
      SECRET,
    );
    expect(parseSignedRequest(raw, SECRET)).toBeNull();
  });

  it("returns null for unsupported algorithm", () => {
    const raw = buildSignedRequest(
      { user_id: "abc", algorithm: "MD5" },
      SECRET,
    );
    expect(parseSignedRequest(raw, SECRET)).toBeNull();
  });

  it("handles base64url variants (- and _ chars)", () => {
    // Base64url uses - and _ instead of + and /
    const payload = {
      user_id: "x".repeat(50), // long enough to potentially have padding
      algorithm: "HMAC-SHA256",
      // Use values that produce + or / in standard base64 encoding
      data: "ZZZZZZZZZ?>",
    };
    const raw = buildSignedRequest(payload, SECRET);
    expect(raw).not.toContain("+");
    expect(raw).not.toContain("/");
    expect(raw).not.toContain("=");
    const parsed = parseSignedRequest(raw, SECRET);
    expect(parsed?.user_id).toBe(payload.user_id);
  });
});
