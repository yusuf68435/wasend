import { describe, expect, it } from "vitest";
import {
  passwordFingerprint,
  shouldInvalidateSession,
  type SessionAccountState,
} from "./session-security";

const activeAccount: SessionAccountState = {
  suspended: false,
  deletedAt: null,
  emailVerifiedAt: new Date(),
  hashedPassword: "bcrypt-hash-v1",
};

describe("session security", () => {
  it("keeps an active session with the current password fingerprint", () => {
    expect(
      shouldInvalidateSession(
        activeAccount,
        passwordFingerprint(activeAccount.hashedPassword),
      ),
    ).toBe(false);
  });

  it("revokes a session after the password hash changes", () => {
    expect(
      shouldInvalidateSession(activeAccount, passwordFingerprint("old-hash")),
    ).toBe(true);
  });

  it.each([
    null,
    { ...activeAccount, suspended: true },
    { ...activeAccount, deletedAt: new Date() },
    { ...activeAccount, emailVerifiedAt: null },
  ])("revokes missing or blocked accounts", (account) => {
    expect(shouldInvalidateSession(account, undefined)).toBe(true);
  });

  it("upgrades a pre-fingerprint token without revoking an active account", () => {
    expect(shouldInvalidateSession(activeAccount, undefined)).toBe(false);
  });
});
