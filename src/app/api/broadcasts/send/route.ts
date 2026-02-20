import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { broadcastId } = await request.json();
  if (!broadcastId) {
    return NextResponse.json({ error: "Broadcast ID zorunlu" }, { status: 400 });
  }

  const broadcast = await prisma.broadcast.findFirst({
    where: { id: broadcastId, userId },
  });
  if (!broadcast) {
    return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
  }

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!apiToken || !phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp API ayarları eksik" }, { status: 400 });
  }

  // Get target contacts
  const whereClause: { userId: string; tags?: { contains: string } } = { userId };
  if (broadcast.targetTags) {
    const tags = broadcast.targetTags.split(",").map((t) => t.trim());
    // Find contacts that have any of the target tags
    whereClause.tags = { contains: tags[0] };
  }

  const contacts = await prisma.contact.findMany({ where: whereClause });

  // Update broadcast status
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: "sending" },
  });

  let sentCount = 0;

  for (const contact of contacts) {
    try {
      await sendWhatsAppMessage({
        to: contact.phone,
        message: broadcast.message,
        phoneNumberId,
        apiToken,
      });

      await prisma.message.create({
        data: {
          content: broadcast.message,
          direction: "outgoing",
          phone: contact.phone,
          userId,
          contactId: contact.id,
          status: "sent",
        },
      });

      sentCount++;
    } catch (error) {
      console.error(`Broadcast send error for ${contact.phone}:`, error);
    }
  }

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: "sent", sentCount },
  });

  return NextResponse.json({ sentCount, total: contacts.length });
}
