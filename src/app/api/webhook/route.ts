import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// WhatsApp webhook verification (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// WhatsApp incoming messages (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) {
      return NextResponse.json({ status: "no message" });
    }

    const message = value.messages[0];
    const senderPhone = message.from;
    const messageText = message.text?.body || "";
    const phoneNumberId = value.metadata?.phone_number_id;

    // Find the user who owns this phone number ID
    const user = await prisma.user.findFirst({
      where: { phone: phoneNumberId },
    });

    if (!user) {
      return NextResponse.json({ status: "user not found" });
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: { userId: user.id, phone: senderPhone },
    });

    if (!contact) {
      const senderName =
        value.contacts?.[0]?.profile?.name || senderPhone;
      contact = await prisma.contact.create({
        data: {
          phone: senderPhone,
          name: senderName,
          userId: user.id,
        },
      });
    }

    // Save incoming message
    await prisma.message.create({
      data: {
        content: messageText,
        direction: "incoming",
        phone: senderPhone,
        userId: user.id,
        contactId: contact.id,
      },
    });

    // Check auto-reply rules
    const autoReplies = await prisma.autoReply.findMany({
      where: { userId: user.id, isActive: true },
    });

    const matchedReply = autoReplies.find((rule) =>
      messageText.toLowerCase().includes(rule.trigger.toLowerCase())
    );

    if (matchedReply) {
      const apiToken = process.env.WHATSAPP_API_TOKEN;
      if (apiToken && phoneNumberId) {
        await sendWhatsAppMessage({
          to: senderPhone,
          message: matchedReply.response,
          phoneNumberId,
          apiToken,
        });

        // Save outgoing auto-reply message
        await prisma.message.create({
          data: {
            content: matchedReply.response,
            direction: "outgoing",
            phone: senderPhone,
            userId: user.id,
            contactId: contact.id,
            status: "sent",
          },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
