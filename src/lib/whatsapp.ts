const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const FETCH_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

interface SendMessageParams {
  to: string;
  message: string;
  phoneNumberId: string;
  apiToken: string;
}

export interface SendMessageResult {
  waMessageId: string | null;
  raw: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Meta Graph API fetch wrapper:
 * - 30 sn timeout (AbortSignal)
 * - 429 (rate limit) + 5xx (transient) için 2 retry, exponential backoff + jitter
 * - 4xx (400/401/403) retry edilmez — kalıcı hata
 */
async function fetchMeta(
  url: string,
  init: RequestInit,
  errorContext: string,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      // Kalıcı hata: retry yapma
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }
      // Başarılı veya tek seferlik transient — retry logic
      if (res.ok) return res;

      // 429 / 5xx → retry'a uygun
      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        // 429 için Retry-After header'ını respect et
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? Math.min(Number(retryAfter) * 1000, 30_000)
          : backoffMs;
        console.warn(
          `${errorContext}: ${res.status}, ${Math.round(waitMs)}ms bekle (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
        );
        await sleep(waitMs);
        continue;
      }

      return res; // son deneme, response'u döndür
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(
          `${errorContext}: ${lastError.message}, ${Math.round(backoffMs)}ms bekle (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
        );
        await sleep(backoffMs);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError || new Error(`${errorContext}: tüm retry'lar başarısız`);
}

export async function sendWhatsAppMessage({
  to,
  message,
  phoneNumberId,
  apiToken,
}: SendMessageParams): Promise<SendMessageResult> {
  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const response = await fetchMeta(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }),
    },
    "sendWhatsAppMessage",
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "WhatsApp mesaj gönderilemedi");
  }

  const waMessageId: string | null = data?.messages?.[0]?.id ?? null;
  return { waMessageId, raw: data };
}

export type MediaType = "image" | "document" | "video" | "audio";

export async function sendWhatsAppMedia({
  to,
  mediaType,
  mediaUrl,
  caption,
  filename,
  phoneNumberId,
  apiToken,
}: {
  to: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption?: string;
  filename?: string;
  phoneNumberId: string;
  apiToken: string;
}): Promise<SendMessageResult> {
  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const mediaPayload: Record<string, unknown> = { link: mediaUrl };
  if (caption && (mediaType === "image" || mediaType === "video" || mediaType === "document")) {
    mediaPayload.caption = caption;
  }
  if (filename && mediaType === "document") {
    mediaPayload.filename = filename;
  }

  const response = await fetchMeta(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/\D/g, ""),
        type: mediaType,
        [mediaType]: mediaPayload,
      }),
    },
    "sendWhatsAppMedia",
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Medya mesaj gönderilemedi");
  }

  const waMessageId: string | null = data?.messages?.[0]?.id ?? null;
  return { waMessageId, raw: data };
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = "tr",
  phoneNumberId,
  apiToken,
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  phoneNumberId: string;
  apiToken: string;
}): Promise<SendMessageResult> {
  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const response = await fetchMeta(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      }),
    },
    "sendWhatsAppTemplate",
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Template gönderilemedi");
  }

  const waMessageId: string | null = data?.messages?.[0]?.id ?? null;
  return { waMessageId, raw: data };
}
