import { toZonedTime } from "date-fns-tz";

export const DEFAULT_TZ = "Europe/Istanbul";

export function isInBusinessHours(
  now: Date,
  timezone: string,
  startHHmm: string | null | undefined,
  endHHmm: string | null | undefined,
  workDays: string | null | undefined,
): boolean {
  if (!startHHmm || !endHHmm) return true;

  const zoned = toZonedTime(now, timezone || DEFAULT_TZ);
  const dow = zoned.getDay();

  if (workDays) {
    const allowed = workDays
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (allowed.length > 0 && !allowed.includes(dow)) return false;
  }

  const current = zoned.getHours() * 60 + zoned.getMinutes();
  const start = parseHHmm(startHHmm);
  const end = parseHHmm(endHHmm);
  if (start === null || end === null) return true;

  if (start <= end) return current >= start && current < end;
  return current >= start || current < end;
}

function parseHHmm(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}
