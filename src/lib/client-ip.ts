type HeaderReader = Pick<Headers, "get">;

/**
 * Reverse proxy tarafindan yazilan istemci IP'sini okur.
 * X-Real-IP onceliklidir; X-Forwarded-For kullanilmak zorundaysa istemcinin
 * kendi ekleyebilecegi en soldaki deger yerine bize en yakin (en sagdaki)
 * proxy degeri kullanilir.
 */
export function getTrustedClientIp(headers: HeaderReader): string | null {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cloudflareIp = headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return null;

  const chain = forwarded
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  return chain.at(-1) ?? null;
}
