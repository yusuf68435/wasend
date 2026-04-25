import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const KEY_PREFIX = "ws_live_";

export const ALL_SCOPES = ["read", "send", "write"] as const;
export type ApiScope = (typeof ALL_SCOPES)[number];

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
  scopes: string[];
}

export interface VerifyOptions {
  /**
   * Faz 9: gerekli scope. Endpoint'in ihtiyaç duyduğu erişim seviyesini
   * belirtir; key'in scope listesinde yoksa null döner (403).
   *   - "read"  → GET endpoint'leri
   *   - "send"  → mesaj gönderim, flow trigger
   *   - "write" → contact create/update
   * Verilmezse scope kontrol edilmez (geriye dönük uyumluluk).
   */
  requireScope?: ApiScope;
  /** Audit için gelen IP — last-used tracking'e yazılır */
  ip?: string;
}

/**
 * Bir Request'ten en güvenilir client IP'yi çıkar.
 * - x-forwarded-for'un ilk değeri (proxy chain'de en sol = client)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 */
export function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

export async function verifyApiKey(
  authHeader: string | null,
  opts: VerifyOptions = {},
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

  // Faz 9: scope kontrolü
  const scopes = (key.scopes || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (opts.requireScope && !scopes.includes(opts.requireScope)) {
    return null;
  }

  // Fire-and-forget last-used tracking — avoid blocking on writes.
  prisma.apiKey
    .update({
      where: { id: key.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: opts.ip ?? null,
        usageCount: { increment: 1 },
      },
    })
    .catch(() => undefined);

  return { userId: key.userId, keyId: key.id, scopes };
}
