import type { NextConfig } from "next";
import path from "path";

// NOT: Content-Security-Policy src/middleware.ts tarafından per-request
// nonce ile set ediliyor ('unsafe-inline' script-src'te yok). Burada sadece
// per-request değişmeyen static güvenlik header'ları var.

const nextConfig: NextConfig = {
  // Force Next.js/Turbopack to use this directory as the workspace root,
  // preventing it from walking up to the parent repo and breaking
  // node_modules resolution inside git worktrees on Windows.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  // iyzipay dinamik require kullanıyor, Next.js bundle edemez.
  // External olarak bırakınca runtime Node.js require'ı çalışır.
  serverExternalPackages: ["iyzipay"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
