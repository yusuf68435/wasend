import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendMessageSchema, formatZodError } from "@/lib/validation";
import { resolveWACredentials } from "@/lib/wa-credentials";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const { contactId, message } = parsed.data;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) {
    return NextResponse.json({ error: "Kişi bulunamadı" }, { status: 404 });
  }

  if (contact.optedOut) {
    return NextResponse.json(
      { error: "Bu kişi mesaj almaktan çıktı (opt-out)." },
      { status: 403 },
    );
  }

  const { apiToken, phoneNumberId } = await resolveWACredentials(userId);
  if (!apiToken || !phoneNumberId) {
    return NextResponse.json(
      { error: "WhatsApp API ayarları eksik. Ayarlar sayfasından yapılandırın." },
      { status: 400 },
    );
  }

  try {
    const result = await sendWhatsAppMessage({
      to: contact.phone,
      message,
      phoneNumberId,
      apiToken,
    });

    const saved = await prisma.message.create({
      data: {
        content: message,
        direction: "outgoing",
        phone: contact.phone,
        userId,
        contactId: contact.id,
        status: "sent",
        waMessageId: result.waMessageId,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Mesaj gönderilemedi";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
