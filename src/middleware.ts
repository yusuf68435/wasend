import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP nonce middleware — her istekte taze nonce üretir ve script-src'e
 * 'nonce-{value}' olarak koyar. Böylece 'unsafe-inline' kaldırılabilir
 * ve XSS'e karşı CSP'nin asıl faydası geri gelir.
 *
 * Dev'de nonce yerine 'unsafe-inline' + 'unsafe-eval' açık kalır —
 * Next.js HMR ve React Fast Refresh buna ihtiyaç duyar.
 *
 * Referans: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}

function buildCsp(nonce: string, isProd: boolean): string {
  // strict-dynamic: nonce'lu script'in dinamik olarak yüklediği script'ler
  // otomatik güvenilir sayılır. https: fallback, strict-dynamic desteklemeyen
  // eski tarayıcılar için.
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' https:`
    : `'self' 'unsafe-inline' 'unsafe-eval'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind v4 + inline style attributes için style-src unsafe-inline kalıyor.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // GA + reCAPTCHA + Meta Graph + Anthropic
    "connect-src 'self' https://graph.facebook.com https://api.anthropic.com https://www.google-analytics.com https://www.google.com",
    // reCAPTCHA iframe gerektirir (bot challenge)
    "frame-src https://www.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const nonce = generateNonce();
  const csp = buildCsp(nonce, isProd);

  // Next.js'in script tag'lerine nonce basması için özel header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Statik asset'ler ve image-optimization hariç tüm sayfalar:
     * - /api eşleşir (API route'larına da CSP header'ı eklenir — zararsız)
     * - /_next/static hariç (bundler asset'leri)
     * - /_next/image hariç (optimized images)
     * - favicon, robots vb hariç
     */
    {
      source: "/((?!api/webhook|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
