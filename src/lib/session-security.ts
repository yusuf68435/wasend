import { createHash } from "crypto";

export interface SessionAccountState {
  suspended: boolean;
  deletedAt: Date | null;
  emailVerifiedAt: Date | null;
  hashedPassword: string;
}

export function passwordFingerprint(hashedPassword: string): string {
  return createHash("sha256").update(hashedPassword).digest("hex");
}

export function shouldInvalidateSession(
  account: SessionAccountState | null,
  tokenFingerprint: unknown,
): boolean {
  if (
    !account ||
    account.suspended ||
    account.deletedAt !== null ||
    account.emailVerifiedAt === null
  ) {
    return true;
  }

  // Tokens issued before fingerprint support are upgraded on their first read.
  if (typeof tokenFingerprint !== "string") return false;
  return tokenFingerprint !== passwordFingerprint(account.hashedPassword);
}
