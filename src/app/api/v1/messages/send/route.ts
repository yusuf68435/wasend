import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { sendWhatsAppMessage, sendWhatsAppMedia } from "@/lib/whatsapp";
import { v1SendMessageSchema, formatZodError } from "@/lib/validation";
import { dispatchWebhook } from "@/lib/outgoing-webhook";

export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Yetkisiz — geçerli bir API key gerekli" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = v1SendMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { to, message, mediaType, mediaUrl } = parsed.data;

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!apiToken || !phoneNumberId) {
    return NextResponse.json(
      { error: "WhatsApp API ayarları eksik" },
      { status: 400 },
    );
  }

  const contact = await prisma.contact.findFirst({
    where: { userId: auth.userId, phone: to },
  });
  if (contact?.optedOut) {
    return NextResponse.json(
      { error: "Bu kişi mesaj almaktan çıktı (opt-out)." },
      { status: 403 },
    );
  }

  try {
    const result =
      mediaType && mediaUrl
        ? await sendWhatsAppMedia({
            to,
            mediaType,
            mediaUrl,
            caption: message,
            phoneNumberId,
            apiToken,
          })
        : await sendWhatsAppMessage({
            to,
            message,
            phoneNumberId,
            apiToken,
          });

    const saved = await prisma.message.create({
      data: {
        content: message,
        direction: "outgoing",
        phone: to,
        userId: auth.userId,
        contactId: contact?.id ?? null,
        status: "sent",
        waMessageId: result.waMessageId,
        mediaType: mediaType ?? null,
        mediaUrl: mediaUrl ?? null,
        caption: mediaType ? message : null,
      },
    });

    dispatchWebhook({
      userId: auth.userId,
      event: "message.sent",
      data: {
        messageId: saved.id,
        waMessageId: saved.waMessageId,
        to,
        content: message,
      },
    });

    return NextResponse.json({
      id: saved.id,
      waMessageId: saved.waMessageId,
      status: saved.status,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Mesaj gönderilemedi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
