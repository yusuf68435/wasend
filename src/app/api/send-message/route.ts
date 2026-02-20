import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { contactId, message } = await request.json();
  if (!contactId || !message) {
    return NextResponse.json({ error: "Kişi ve mesaj zorunlu" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) {
    return NextResponse.json({ error: "Kişi bulunamadı" }, { status: 404 });
  }

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    return NextResponse.json(
      { error: "WhatsApp API ayarları eksik. Ayarlar sayfasından yapılandırın." },
      { status: 400 }
    );
  }

  try {
    await sendWhatsAppMessage({
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
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Mesaj gönderilemedi";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
