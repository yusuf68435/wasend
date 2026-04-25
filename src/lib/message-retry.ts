/**
 * Message retry helpers — Faz 4 webhook retry queue.
 *
 * Mantık:
 *   - Bir outbound mesaj göndericisi (broadcast/send/reminder) Meta'dan
 *     5xx, 429, network error alırsa Message kaydı status='retry_pending'
 *     ile oluşturulur, nextRetryAt = now + backoff(retryCount).
 *   - Cron /api/cron/retry-messages dakikada bir status='retry_pending' AND
 *     nextRetryAt <= now() olanları bulur, tekrar gönderir.
 *   - Başarı → status='sent', retryCount donar.
 *   - Başarısız + retryCount < MAX → retryCount++, nextRetryAt güncellenir.
 *   - Başarısız + retryCount >= MAX → status='failed' (kalıcı).
 *
 * Backoff stratejisi (exponential + jitter):
 *   1.  +60s     (1 dakika)
 *   2.  +5m
 *   3.  +30m
 *   4.  +2h
 *   5.  +12h
 *
 * Toplam ~14h içinde 5 deneme. Bundan sonra failed.
 */

export const MAX_RETRY_ATTEMPTS = 5;

const BACKOFF_SCHEDULE_MS: ReadonlyArray<number> = [
  60_000, // 1m
  5 * 60_000, // 5m
  30 * 60_000, // 30m
  2 * 60 * 60_000, // 2h
  12 * 60 * 60_000, // 12h
];

/**
 * Bir sonraki retry zamanını hesapla.
 * @param retryCount Şu ana kadar yapılan deneme sayısı (0=hiç, 1=1 deneme yapıldı vs)
 * @returns Date — bu zamana kadar bekle, ondan sonra tekrar dene. null → max'a ulaşıldı.
 */
export function computeNextRetryAt(
  retryCount: number,
  now: Date = new Date(),
): Date | null {
  if (retryCount >= MAX_RETRY_ATTEMPTS) return null;
  const idx = Math.min(retryCount, BACKOFF_SCHEDULE_MS.length - 1);
  const base = BACKOFF_SCHEDULE_MS[idx];
  // ±20% jitter — thundering-herd önler
  const jitter = base * 0.2 * (Math.random() * 2 - 1);
  const delayMs = Math.max(1000, Math.round(base + jitter));
  return new Date(now.getTime() + delayMs);
}

/**
 * Verilen hata mesajından retry uygun olup olmadığını kestir.
 *
 * Kalıcı (retry yok):
 *   - 400/401/403 (auth, permission, malformed)
 *   - "invalid token" / "OAuth" / "permission" / "not found"
 *   - Meta error code: 100, 190, 200 (auth/permission)
 *
 * Geçici (retry yap):
 *   - 5xx, 429, timeout, ECONNRESET, fetch failed
 *   - Meta error code: 1, 2, 4, 17, 32, 613 (transient)
 *   - "rate limit" / "throttled" / "internal server"
 *
 * Belirsiz → konservatif: retry yap (false positive'i tercih ederiz; 5 deneme
 * sonrası nasılsa failed olur).
 */
export function isRetryableError(reason: string): boolean {
  const r = reason.toLowerCase();

  // Açık kalıcı hatalar
  const PERMANENT_PATTERNS = [
    /\b(401|403|400)\b/,
    /invalid (?:token|access|credential|api key)/,
    /oauth/,
    /permission denied/,
    /not authoriz/,
    /not allow/,
    /\bunauthorized\b/,
    /\bforbidden\b/,
    /\bnot found\b/,
    /code:\s*(100|190|200|10|803)\b/, // Meta auth/permission codes
    /unsupported message type/,
    /(?:phone|recipient).*(?:invalid|malformed)/,
    /hesap.*?ask[ıi]/, // suspended account
  ];
  for (const pat of PERMANENT_PATTERNS) {
    if (pat.test(r)) return false;
  }

  // Açık transient
  const TRANSIENT_PATTERNS = [
    /\b(429|500|502|503|504)\b/,
    /rate.?limit/,
    /throttl/,
    /timeout/,
    /timed out/,
    /econnrese/,
    /etimedout/,
    /enotfound/,
    /econnref/,
    /fetch failed/,
    /network/,
    /temporarily/,
    /try again/,
    /code:\s*(1|2|4|17|32|613|368)\b/,
    /internal (?:server )?error/,
  ];
  for (const pat of TRANSIENT_PATTERNS) {
    if (pat.test(r)) return true;
  }

  // Belirsiz: bir kez denemeye değer
  return true;
}

/**
 * Retry sonucunu hesapla — bir send başarısız oldu, sıradaki state ne olmalı?
 *
 * @returns
 *   - status: yeni status değeri ('retry_pending' veya 'failed')
 *   - retryCount: yeni retry sayısı
 *   - nextRetryAt: tekrar denenecek zaman (null → kalıcı failed)
 *   - reason: state geçişinin sebebi (log için)
 */
export interface RetryDecision {
  status: "retry_pending" | "failed";
  retryCount: number;
  nextRetryAt: Date | null;
  permanent: boolean;
}

export function decideRetry(
  currentRetryCount: number,
  errorReason: string,
  now: Date = new Date(),
): RetryDecision {
  const newCount = currentRetryCount + 1;
  // Kalıcı hata → retry yok
  if (!isRetryableError(errorReason)) {
    return {
      status: "failed",
      retryCount: newCount,
      nextRetryAt: null,
      permanent: true,
    };
  }
  // Max'a ulaşıldı → failed
  if (newCount >= MAX_RETRY_ATTEMPTS) {
    return {
      status: "failed",
      retryCount: newCount,
      nextRetryAt: null,
      permanent: false,
    };
  }
  // Tekrar dene
  return {
    status: "retry_pending",
    retryCount: newCount,
    nextRetryAt: computeNextRetryAt(newCount, now),
    permanent: false,
  };
}
