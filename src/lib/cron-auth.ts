import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export interface CronAuthResult {
  ok: boolean;
  response?: NextResponse;
}

// Cron endpoint'leri için ortak kimlik doğrulama + rate limit.
// Production'da CRON_SECRET zorunlu; fallback yok. Dev'de yoksa uyarır.
export function verifyCronAuth(request: Request): CronAuthResult {
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL: CRON_SECRET missing in production");
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Cron not configured" },
          { status: 500 },
        ),
      };
    }
    // Dev-only fallback (uyarı ile)
    const dev = process.env.NEXTAUTH_SECRET;
    if (!dev) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "No secret configured" },
          { status: 500 },
        ),
      };
    }
    if (authHeader !== `Bearer ${dev}`) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }),
      };
    }
    return { ok: true };
  }

  if (expected.length < 32) {
    console.error("CRITICAL: CRON_SECRET < 32 karakter");
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Weak cron secret" },
        { status: 500 },
      ),
    };
  }

  // IP tabanlı rate limit (brute force ve DoS koruması)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(`cron:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Rate limited" },
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    };
  }

  if (authHeader !== `Bearer ${expected}`) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }),
    };
  }

  return { ok: true };
}
