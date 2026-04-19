import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sleep } from "@/lib/rate-limit";

export interface ProcessBroadcastResult {
  sentCount: number;
  failedCount: number;
  total: number;
}

export async function processBroadcast(
  broadcastId: string,
): Promise<ProcessBroadcastResult> {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });
  if (!broadcast) throw new Error("Kampanya bulunamadı");

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!apiToken || !phoneNumberId) {
    throw new Error("WhatsApp API ayarları eksik");
  }

  // Opted-out contacts are excluded by default
  const allContacts = await prisma.contact.findMany({
    where: { userId: broadcast.userId, optedOut: false },
  });

  let contacts = allContacts;
  if (broadcast.targetTags) {
    const targetTags = broadcast.targetTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (targetTags.length > 0) {
      contacts = allContacts.filter((c) => {
        if (!c.tags) return false;
        const contactTags = c.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        return targetTags.some((t) => contactTags.includes(t));
      });
    }
  }

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: "sending" },
  });

  // Rate limit: rateLimit messages per minute.
  const rateLimit = Math.max(1, broadcast.rateLimit || 80);
  const minDelayMs = Math.ceil(60000 / rateLimit);

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    const start = Date.now();
    try {
      const result = await sendWhatsAppMessage({
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
          userId: broadcast.userId,
          contactId: contact.id,
          status: "sent",
          waMessageId: result.waMessageId,
        },
      });

      sentCount++;
    } catch (error) {
      failedCount++;
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Broadcast send error for ${contact.phone}:`, reason);
      await prisma.message.create({
        data: {
          content: broadcast.message,
          direction: "outgoing",
          phone: contact.phone,
          userId: broadcast.userId,
          contactId: contact.id,
          status: "failed",
          failedReason: reason.slice(0, 500),
        },
      });
    }

    const elapsed = Date.now() - start;
    if (elapsed < minDelayMs) {
      await sleep(minDelayMs - elapsed);
    }
  }

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: "sent", sentCount, failedCount },
  });

  return { sentCount, failedCount, total: contacts.length };
}
