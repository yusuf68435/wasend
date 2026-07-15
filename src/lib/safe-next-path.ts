const APP_ORIGIN = "https://wasend.tech";
const DEFAULT_PATH = "/dashboard";

function validFallback(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : DEFAULT_PATH;
}

/** Accept only same-origin relative paths for post-auth redirects. */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = DEFAULT_PATH,
): string {
  const safeFallback = validFallback(fallback);
  if (!raw) return safeFallback;

  let candidate: string;
  try {
    candidate = decodeURIComponent(raw);
  } catch {
    return safeFallback;
  }

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return safeFallback;
  }

  try {
    const url = new URL(candidate, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN) return safeFallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return safeFallback;
  }
}
