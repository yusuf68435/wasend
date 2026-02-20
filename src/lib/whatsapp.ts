const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

interface SendMessageParams {
  to: string;
  message: string;
  phoneNumberId: string;
  apiToken: string;
}

export async function sendWhatsAppMessage({
  to,
  message,
  phoneNumberId,
  apiToken,
}: SendMessageParams) {
  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
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
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "WhatsApp mesaj gönderilemedi");
  }

  return data;
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
}) {
  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
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
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Template gönderilemedi");
  }

  return data;
}
