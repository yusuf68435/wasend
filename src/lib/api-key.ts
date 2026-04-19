import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const KEY_PREFIX = "ws_live_";

export interface GeneratedKey {
  plaintext: string;
  prefix: string;
  hash: string;
}

export function generateApiKey(): GeneratedKey {
  const raw = crypto.randomBytes(32).toString("base64url");
  const plaintext = `${KEY_PREFIX}${raw}`;
  const prefix = plaintext.slice(0, 16);
  const hash = crypto.createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, prefix, hash };
}

export interface AuthedKey {
  userId: string;
  keyId: string;
}

export async function verifyApiKey(
  authHeader: string | null,
): Promise<AuthedKey | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token.startsWith(KEY_PREFIX)) return null;

  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const key = await prisma.apiKey.findUnique({
    where: { hash },
  });
  if (!key) return null;
  if (key.revokedAt) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  // Fire-and-forget last-used tracking — avoid blocking on writes.
  prisma.apiKey
    .update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => undefined);

  return { userId: key.userId, keyId: key.id };
}
