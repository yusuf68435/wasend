/**
 * Next.js instrumentation — server boot'ta bir kez çalışır.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Boot-time sanity check'ler:
 * - Environment variable doğrulaması (prod'da fail-fast)
 * - Sentry init (config dosyalarından)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // env validasyonu — eksik/hatalı prod env'de throw eder ve server başlamaz
    await import("./lib/env");
  }

  // Sentry sadece DSN varsa import edilir. Import bile yoksa Turbopack
  // @sentry/nextjs → @fastify/otel junction point'leri yaratmaz (Windows'ta
  // bu junction'lar non-ASCII path'te patlıyor).
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge" && process.env.SENTRY_DSN) {
    await import("../sentry.edge.config");
  }
}
