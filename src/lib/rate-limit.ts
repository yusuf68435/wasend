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
