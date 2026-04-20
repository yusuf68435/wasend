// Sentry server-side initialization.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    release: process.env.APP_VERSION || "unversioned",
    environment: process.env.NODE_ENV,
  });
}
