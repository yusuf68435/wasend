// Sentry client-side initialization.
// SENTRY_DSN env yoksa noop — fail-safe.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // 10% trace sampling — production için düşük, dev'de 100%
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // PII redaction — default Sentry helpers
    sendDefaultPii: false,
    // Release tracking (varsa)
    release: process.env.NEXT_PUBLIC_APP_VERSION || "unversioned",
    environment: process.env.NODE_ENV,
    // Ignore common noise
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // NextAuth redirect normal
      "NEXT_REDIRECT",
    ],
  });
}
