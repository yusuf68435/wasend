type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Bellek sızıntısı koruması — eski bucket'ları periyodik temizle.
// Her 10 dk'da resetAt geçmişte olanları at. Bounded Map büyüklüğü.
const GC_INTERVAL_MS = 10 * 60 * 1000;
let lastGc = Date.now();
function gcIfNeeded(now: number): void {
  if (now - lastGc < GC_INTERVAL_MS) return;
  lastGc = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  gcIfNeeded(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const b = { count: 1, resetAt: now + windowMs };
    buckets.set(key, b);
    return { allowed: true, remaining: limit - 1, resetAt: b.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Per-user default rate limit — tenant-level API abuse koruması.
 * STARTER planlar için makul bir üst sınır. Auth endpoint'leri (login,
 * register) IP-based rate limit kullanmaya devam eder.
 *
 * Varsayılan: 300 request / dakika. Broadcast processor gibi background
 * işler bu limitin dışında. UI tipik en yoğun kullanıcıda ~60 req/dk üretir.
 */
const PER_USER_DEFAULT_LIMIT = 300;
const PER_USER_DEFAULT_WINDOW_MS = 60 * 1000;

export function checkUserRateLimit(
  userId: string,
  opts: { limit?: number; windowMs?: number; scope?: string } = {},
): { allowed: boolean; remaining: number; resetAt: number } {
  const scope = opts.scope || "default";
  const limit = opts.limit ?? PER_USER_DEFAULT_LIMIT;
  const windowMs = opts.windowMs ?? PER_USER_DEFAULT_WINDOW_MS;
  return checkRateLimit(`user:${userId}:${scope}`, limit, windowMs);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Faz 12: Per-API-key rate limit. Public API v1 endpoint'leri için.
 *
 * Varsayılan: 60 req/dk. Anahtar başına override için ApiKey'e ileride
 * kolon eklenebilir; şimdilik tek varsayılan + opts.rpm.
 *
 * 429 response için RFC 6585 + draft-ietf-httpapi-ratelimit header'ları:
 *   - X-RateLimit-Limit
 *   - X-RateLimit-Remaining
 *   - X-RateLimit-Reset (UNIX epoch saniye)
 *   - Retry-After (saniye, sadece 429'da)
 */
const API_KEY_DEFAULT_RPM = 60;

export interface ApiKeyRateLimit {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export function checkApiKeyRateLimit(
  keyId: string,
  opts: { rpm?: number } = {},
): ApiKeyRateLimit {
  const limit = opts.rpm ?? API_KEY_DEFAULT_RPM;
  const r = checkRateLimit(`apikey:${keyId}`, limit, 60_000);
  const now = Date.now();
  const retryAfterSec = r.allowed
    ? 0
    : Math.max(1, Math.ceil((r.resetAt - now) / 1000));
  return {
    allowed: r.allowed,
    limit,
    remaining: r.remaining,
    resetAt: r.resetAt,
    retryAfterSec,
  };
}

export function apiKeyRateLimitHeaders(
  r: ApiKeyRateLimit,
): Record<string, string> {
  const h: Record<string, string> = {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
  };
  if (!r.allowed) h["Retry-After"] = String(r.retryAfterSec);
  return h;
}
