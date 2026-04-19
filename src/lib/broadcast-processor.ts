import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  type MediaType,
} from "@/lib/whatsapp";
import { sleep } from "@/lib/rate-limit";
import { parseRules, resolveSegmentContacts } from "@/lib/segment-resolver";

const MEDIA_TYPES: readonly MediaType[] = [
  "image",
  "document",
  "video",
  "audio",
];

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

  // Audience selection: segment takes priority over targetTags
  let contacts: Array<{ id: string; phone: string; tags: string | null }>;

  if (broadcast.segmentId) {
    const segment = await prisma.segment.findFirst({
      where: { id: broadcast.segmentId, userId: broadcast.userId },
    });
    if (!segment) throw new Error("Segment bulunamadı");
    const rules = parseRules(segment.rules);
    if (!rules) throw new Error("Segment kuralları geçersiz");
    const resolved = await resolveSegmentContacts(broadcast.userId, rules);
    // Filter out opted-out contacts (segment rules may or may not include this)
    const withOptOut = await prisma.contact.findMany({
      where: {
        id: { in: resolved.map((r) => r.id) },
        optedOut: false,
      },
      select: { id: true, phone: true, tags: true },
    });
    contacts = withOptOut;
  } else {
    const allContacts = await prisma.contact.findMany({
      where: { userId: broadcast.userId, optedOut: false },
      select: { id: true, phone: true, tags: true },
    });

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
      } else {
        contacts = allContacts;
      }
    } else {
      contacts = allContacts;
    }
  }

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: "sending" },
  });

  // Rate limit: rateLimit messages per minute.
  const rateLimit = Math.max(1, broadcast.rateLimit || 80);
  const minDelayMs = Math.ceil(60000 / rateLimit);

  const mediaType = MEDIA_TYPES.includes(broadcast.mediaType as MediaType)
    ? (broadcast.mediaType as MediaType)
    : null;
  const useMedia = mediaType && broadcast.mediaUrl;

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    const start = Date.now();
    try {
      const result = useMedia
        ? await sendWhatsAppMedia({
            to: contact.phone,
            mediaType: mediaType as MediaType,
            mediaUrl: broadcast.mediaUrl as string,
            caption: broadcast.message,
            phoneNumberId,
            apiToken,
          })
        : await sendWhatsAppMessage({
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
          mediaType: mediaType ?? null,
          mediaUrl: broadcast.mediaUrl ?? null,
          caption: useMedia ? broadcast.message : null,
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
