import { NextResponse } from "next/server";

/**
 * CSP proxy — Next.js 16 convention ("middleware" → "proxy").
 *
 * U7'de strict nonce + strict-dynamic denendi; Next.js 16 kendi client
 * script'lerine otomatik nonce koymadığı için tüm JS CSP tarafından
 * bloklandı ve sayfa beyaz kaldı. Rollback: izin verici CSP (unsafe-inline
 * + unsafe-eval script-src'te; style-src zaten Tailwind için unsafe-inline).
 *
 * TODO: Next.js 16 nonce propagation için next/script API veya üst-metre
 * çözüme geçince burayı strict'e taşı.
 */

function buildCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://graph.facebook.com https://api.anthropic.com https://www.google-analytics.com https://www.google.com",
    "frame-src https://www.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy() {
  const response = NextResponse.next();
  response.headers.set("content-security-policy", buildCsp());
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api/webhook|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
