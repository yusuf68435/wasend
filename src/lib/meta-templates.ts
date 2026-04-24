const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

export interface MetaTemplateSubmitInput {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  bodyText: string;
  /** Opsiyonel per-tenant override. Yoksa env fallback. */
  apiToken?: string | null;
  wabaId?: string | null;
}

export async function submitTemplateToMeta(
  input: MetaTemplateSubmitInput,
): Promise<{ metaId: string }> {
  const wabaId = input.wabaId || process.env.WHATSAPP_WABA_ID;
  const apiToken = input.apiToken || process.env.WHATSAPP_API_TOKEN;
  if (!wabaId || !apiToken) {
    throw new Error(
      "WABA ID veya API token ayarlı değil — yerel olarak kaydedildi, onaylı sayılmıyor.",
    );
  }

  const url = `${WHATSAPP_API_URL}/${wabaId}/message_templates`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      language: input.language,
      category: input.category,
      components: [
        {
          type: "BODY",
          text: input.bodyText,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Meta template submit başarısız");
  }
  return { metaId: String(data.id) };
}

export async function fetchTemplateStatus(
  metaId: string,
  apiTokenOverride?: string | null,
): Promise<{ status: string; reason: string | null }> {
  const apiToken = apiTokenOverride || process.env.WHATSAPP_API_TOKEN;
  if (!apiToken) throw new Error("API token eksik");

  const url = `${WHATSAPP_API_URL}/${metaId}?fields=status,rejected_reason`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Meta template status fetch başarısız");
  }
  return {
    status: (data.status as string) || "PENDING",
    reason: (data.rejected_reason as string) || null,
  };
}
