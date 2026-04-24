/**
 * Meta Embedded Signup — backend helpers.
 *
 * Akış:
 *   1. Frontend FB.login(config_id, scope, response_type='code') çağırır
 *   2. User popup'ta kendi Meta Business hesabıyla giriş yapar, WaSend'e
 *      WhatsApp yönetimi yetkisi verir
 *   3. Popup "code" döner (OAuth authorization code, tek kullanımlık)
 *   4. Frontend → POST /api/whatsapp/embedded-signup { code }
 *   5. Backend: code → long-lived user access token (60gün)
 *   6. Backend: token ile WABA'ları ve telefon numaralarını çeker
 *   7. Backend: /subscribed_apps ile bizim Meta App'i WABA'ya abone eder
 *   8. Backend: encrypted token + waba_id + phone_number_id kullanıcıya kaydeder
 *
 * Gereksinimler (admin ayarlaması):
 *   - META_APP_ID         Meta for Developers App ID
 *   - META_APP_SECRET     Meta App Secret
 *   - META_ES_CONFIG_ID   Embedded Signup flow config ID (BSP config)
 *   - NEXT_PUBLIC_META_APP_ID / NEXT_PUBLIC_META_ES_CONFIG_ID frontend'de kullanılır
 *
 * Meta tarafında admin'in yapması gereken:
 *   - App Review: "whatsapp_business_management" + "whatsapp_business_messaging" izinleri
 *   - Embedded Signup flow config oluşturma (Business Platform → Embedded Signup)
 *   - BSP (Business Solution Provider) statüsüne geçme
 */

const GRAPH_URL = "https://graph.facebook.com/v21.0";

export interface ESConfig {
  appId: string;
  appSecret: string;
  configId: string;
}

/**
 * ES konfigürasyonu var mı? UI bunu ön yükleme ile kontrol eder; yoksa
 * buton gizlenir.
 */
export function getESConfig(): ESConfig | null {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const configId = process.env.META_ES_CONFIG_ID;
  if (!appId || !appSecret || !configId) return null;
  return { appId, appSecret, configId };
}

export interface TokenExchangeResult {
  accessToken: string;
  tokenType: string;
  /** Süre (saniye). Meta long-lived user token ~60 gün döner. */
  expiresIn?: number;
}

/**
 * Auth code → access token.
 * Dönen token user token — WABA'ları yönetebilir. Mesaj gönderimi için
 * normalde system user token lazım ama debug_token ile kontrol edilir.
 */
export async function exchangeAuthCode(
  code: string,
  cfg: ESConfig,
): Promise<TokenExchangeResult> {
  const url = new URL(`${GRAPH_URL}/oauth/access_token`);
  url.searchParams.set("client_id", cfg.appId);
  url.searchParams.set("client_secret", cfg.appSecret);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(30_000),
  });
  const data: {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message?: string };
  } = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(
      data?.error?.message || `Token exchange başarısız (${res.status})`,
    );
  }
  return {
    accessToken: data.access_token,
    tokenType: data.token_type || "bearer",
    expiresIn: data.expires_in,
  };
}

export interface WABAInfo {
  wabaId: string;
  name: string;
  phoneNumbers: Array<{
    phoneNumberId: string;
    displayPhoneNumber: string;
    verifiedName: string | null;
  }>;
}

/**
 * Access token ile kullanıcının erişebildiği WABA'ları ve her biri için
 * telefon numaralarını listeler. Genelde 1 WABA + 1 numara olur.
 */
export async function fetchUserWABAs(accessToken: string): Promise<WABAInfo[]> {
  // 1) Businesses (tek hesap owner birden fazla business'a erişebilir)
  const bizRes = await fetch(
    `${GRAPH_URL}/me/businesses?fields=id,name&access_token=${encodeURIComponent(
      accessToken,
    )}`,
    { signal: AbortSignal.timeout(30_000) },
  );
  const bizData: { data?: Array<{ id: string; name: string }>; error?: { message?: string } } =
    await bizRes.json();
  if (!bizRes.ok) {
    throw new Error(bizData?.error?.message || "Businesses fetch failed");
  }
  const businesses = bizData.data || [];

  const results: WABAInfo[] = [];

  for (const biz of businesses) {
    // 2) Her business için WABA'lar
    const wabaRes = await fetch(
      `${GRAPH_URL}/${biz.id}/owned_whatsapp_business_accounts?fields=id,name&access_token=${encodeURIComponent(
        accessToken,
      )}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    const wabaData: {
      data?: Array<{ id: string; name?: string }>;
      error?: { message?: string };
    } = await wabaRes.json();
    if (!wabaRes.ok) continue;

    for (const w of wabaData.data || []) {
      // 3) WABA'nın telefon numaraları
      const phoneRes = await fetch(
        `${GRAPH_URL}/${w.id}/phone_numbers?fields=id,display_phone_number,verified_name&access_token=${encodeURIComponent(
          accessToken,
        )}`,
        { signal: AbortSignal.timeout(30_000) },
      );
      const phoneData: {
        data?: Array<{
          id: string;
          display_phone_number: string;
          verified_name?: string;
        }>;
      } = await phoneRes.json();

      results.push({
        wabaId: w.id,
        name: w.name || biz.name,
        phoneNumbers: (phoneData.data || []).map((p) => ({
          phoneNumberId: p.id,
          displayPhoneNumber: p.display_phone_number,
          verifiedName: p.verified_name || null,
        })),
      });
    }
  }

  return results;
}

/**
 * Bizim Meta App'i ilgili WABA'ya abone eder. Bundan sonra gelen
 * webhook'lar /api/webhook'a düşer.
 */
export async function subscribeAppToWABA(
  wabaId: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${GRAPH_URL}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(30_000),
  });
  const data: { error?: { message?: string }; success?: boolean } = await res
    .json()
    .catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data?.error?.message || "WABA abone olma başarısız");
  }
}
