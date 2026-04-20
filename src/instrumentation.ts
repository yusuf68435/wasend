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

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
