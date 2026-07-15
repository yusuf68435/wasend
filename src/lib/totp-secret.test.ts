import { beforeAll, describe, expect, it } from "vitest";
import { decodeTotpSecret, encodeTotpSecret } from "./totp-secret";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-nextauth-secret-for-totp-at-rest";
});

const SECRET = "JBSWY3DPEHPK3PXP";

describe("TOTP secret storage", () => {
  it("encrypts and decrypts a Base32 secret", () => {
    const stored = encodeTotpSecret(SECRET);
    expect(stored).not.toBe(SECRET);
    expect(decodeTotpSecret(stored)).toEqual({
      secret: SECRET,
      needsMigration: false,
    });
  });

  it("accepts legacy plaintext secrets and marks them for migration", () => {
    expect(decodeTotpSecret(SECRET)).toEqual({
      secret: SECRET,
      needsMigration: true,
    });
  });

  it("rejects malformed or tampered values", () => {
    expect(decodeTotpSecret("not-a-secret")).toBeNull();
    expect(() => encodeTotpSecret("not-a-secret")).toThrow();
  });
});
