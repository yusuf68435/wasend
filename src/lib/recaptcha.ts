/**
 * Google reCAPTCHA v3 sunucu-tarafı doğrulama.
 *
 * ENV:
 *   - NEXT_PUBLIC_RECAPTCHA_SITE_KEY (client)
 *   - RECAPTCHA_SECRET_KEY (server)
 *
 * Production'da ikisi de set değilse fail-open (uyarı ile). Dev'de token yoksa
 * soft allow. Skoru < 0.5 ise bot kabul edilir.
 */

interface RecaptchaResult {
  ok: boolean;
  score?: number;
  reason?: string;
}

const MIN_SCORE = 0.5;

export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  remoteIp?: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // reCAPTCHA kurulmamışsa: production'da warn, dev'de allow
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("RECAPTCHA_SECRET_KEY missing in production — fail-open");
    }
    return { ok: true, reason: "not-configured" };
  }

  if (!token) {
    // Token yoksa production'da reddet
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "Token eksik" };
    }
    return { ok: true, reason: "dev-no-token" };
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp) params.append("remoteip", remoteIp);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const data: {
      success: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    } = await res.json();

    if (!data.success) {
      return { ok: false, reason: "Doğrulama başarısız" };
    }
    if (data.action && data.action !== expectedAction) {
      return { ok: false, reason: "Action mismatch" };
    }
    if (typeof data.score === "number" && data.score < MIN_SCORE) {
      return { ok: false, score: data.score, reason: "Bot şüphesi yüksek" };
    }
    return { ok: true, score: data.score };
  } catch (e) {
    console.error("reCAPTCHA verify error:", e);
    // Network hatası — production'da fail-open (kullanıcıyı mağdur etmeyelim),
    // ama log'a yaz ki izlenebilsin
    return { ok: true, reason: "verify-network-error" };
  }
}
