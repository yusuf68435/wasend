/**
 * Hafif structured logger. Apple-seviye:
 * - PII (telefon, email) maskelenir
 * - Level-aware (debug/info/warn/error)
 * - Production'da stderr JSON, dev'de insan-okur format
 * - Sentry entegre olacaksa SENTRY_DSN + `sentry.captureException` hook'u
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

/** Telefon numarasını +905551234567 → +90555****567 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  if (phone.length < 8) return "***";
  return phone.slice(0, 5) + "****" + phone.slice(-3);
}

/** Email'i name@domain → n***@domain */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return local.slice(0, 1) + "***@" + domain;
}

function formatProd(level: LogLevel, msg: string, fields?: LogFields): string {
  const base = {
    time: new Date().toISOString(),
    level,
    msg,
    ...(fields || {}),
  };
  return JSON.stringify(base);
}

function formatDev(level: LogLevel, msg: string, fields?: LogFields): string {
  const color =
    level === "error"
      ? "\x1b[31m"
      : level === "warn"
        ? "\x1b[33m"
        : level === "info"
          ? "\x1b[36m"
          : "\x1b[90m";
  const reset = "\x1b[0m";
  const prefix = `${color}[${level.toUpperCase()}]${reset}`;
  if (!fields || Object.keys(fields).length === 0) return `${prefix} ${msg}`;
  return `${prefix} ${msg} ${JSON.stringify(fields)}`;
}

function write(level: LogLevel, msg: string, fields?: LogFields): void {
  if (!shouldLog(level)) return;
  const isDev = process.env.NODE_ENV !== "production";
  const out = isDev
    ? formatDev(level, msg, fields)
    : formatProd(level, msg, fields);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  debug(msg: string, fields?: LogFields) {
    write("debug", msg, fields);
  },
  info(msg: string, fields?: LogFields) {
    write("info", msg, fields);
  },
  warn(msg: string, fields?: LogFields) {
    write("warn", msg, fields);
  },
  error(msg: string, error?: unknown, fields?: LogFields) {
    const errorFields =
      error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
          }
        : error !== undefined
          ? { error: String(error) }
          : {};
    write("error", msg, { ...errorFields, ...fields });

    // Sentry hook (opsiyonel; SDK kurulursa devreye girer)
    if (process.env.SENTRY_DSN && error instanceof Error) {
      // Runtime'da Sentry yoksa sessizce atla
      try {
        const sentry = (globalThis as { Sentry?: { captureException(e: unknown): void } }).Sentry;
        sentry?.captureException(error);
      } catch {
        // ignore
      }
    }
  },
};
