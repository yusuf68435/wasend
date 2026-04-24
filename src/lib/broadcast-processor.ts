import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  type MediaType,
} from "@/lib/whatsapp";
import { sleep } from "@/lib/rate-limit";
import { parseRules, resolveSegmentContacts } from "@/lib/segment-resolver";
import { dispatchWebhook } from "@/lib/outgoing-webhook";

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

/**
 * Broadcast'i "sending" state'ine atomic geçir.
 * Sadece draft/scheduled/failed bir broadcast işlenebilir.
 * Eşzamanlı ikinci bir çağrı 0 satır update eder ve hata fırlatır.
 *
 * Stale recovery: status=sending ama startedAt > STALE_MS önce ise büyük
 * ihtimalle süreç crash'ledi (SIGKILL/OOM) ve finally/catch çalışamadı.
 * Bu durumda reclaim izin veriyoruz — composite unique (broadcastId,
 * contactId) + processedIds filter'ı sayesinde aynı contact'a iki kez
 * mesaj gitmez.
 */
const RUNNABLE_STATUSES = ["draft", "scheduled", "failed"] as const;
const STALE_SENDING_MS = 30 * 60_000; // 30 dk

export async function processBroadcast(
  broadcastId: string,
): Promise<ProcessBroadcastResult> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!apiToken || !phoneNumberId) {
    throw new Error("WhatsApp API ayarları eksik");
  }

  const staleBefore = new Date(Date.now() - STALE_SENDING_MS);
  const claimed = await prisma.broadcast.updateMany({
    where: {
      id: broadcastId,
      OR: [
        { status: { in: [...RUNNABLE_STATUSES] } },
        // Stale "sending" recovery
        { status: "sending", startedAt: { lt: staleBefore } },
      ],
    },
    data: {
      status: "sending",
      startedAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    const existing = await prisma.broadcast.findUnique({
      where: { id: broadcastId },
      select: { id: true, status: true },
    });
    if (!existing) throw new Error("Kampanya bulunamadı");
    throw new Error(
      `Bu kampanya zaten "${existing.status}" durumunda — tekrar gönderilemez`,
    );
  }

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
  });
  if (!broadcast) {
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "failed" },
    }).catch(() => undefined);
    throw new Error("Kampanya bulunamadı");
  }

  try {
    return await runBroadcast(broadcast, broadcastId, apiToken, phoneNumberId);
  } catch (err) {
    // Status'u failed'e geri al ki sıkışıp kalmasın; tekrar denenebilir.
    await prisma.broadcast
      .update({
        where: { id: broadcastId },
        data: { status: "failed", completedAt: new Date() },
      })
      .catch(() => undefined);
    throw err;
  }
}

async function runBroadcast(
  broadcast: {
    id: string;
    userId: string;
    name: string;
    message: string;
    targetTags: string | null;
    segmentId: string | null;
    mediaType: string | null;
    mediaUrl: string | null;
    rateLimit: number;
  },
  broadcastId: string,
  apiToken: string,
  phoneNumberId: string,
): Promise<ProcessBroadcastResult> {
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

  // Retry safety: eğer bu broadcast önceki run'da yarıda kaldıysa, daha önce
  // işlenen contact'ları atla. Composite unique (broadcastId, contactId) ile
  // DB koruma var; ama WA API'sine iki kez istek atmamak için burada da filtre.
  const processed = await prisma.message.findMany({
    where: { broadcastId, contactId: { not: null } },
    select: { contactId: true, status: true },
  });
  const processedIds = new Set(
    processed.map((m) => m.contactId).filter((id): id is string => !!id),
  );
  const totalAudience = contacts.length;
  contacts = contacts.filter((c) => !processedIds.has(c.id));

  // Rate limit: rateLimit messages per minute.
  const rateLimit = Math.max(1, broadcast.rateLimit || 80);
  const minDelayMs = Math.ceil(60000 / rateLimit);

  const mediaType = MEDIA_TYPES.includes(broadcast.mediaType as MediaType)
    ? (broadcast.mediaType as MediaType)
    : null;
  const useMedia = mediaType && broadcast.mediaUrl;

  let sentCount = processed.filter((m) => m.status === "sent").length;
  let failedCount = processed.filter((m) => m.status === "failed").length;

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

      try {
        await prisma.message.create({
          data: {
            content: broadcast.message,
            direction: "outgoing",
            phone: contact.phone,
            userId: broadcast.userId,
            contactId: contact.id,
            broadcastId,
            status: "sent",
            waMessageId: result.waMessageId,
            mediaType: mediaType ?? null,
            mediaUrl: broadcast.mediaUrl ?? null,
            caption: useMedia ? broadcast.message : null,
          },
        });
        sentCount++;
      } catch (dbErr) {
        // P2002 = composite unique ihlali = bu broadcast zaten aynı contact'a
        // gönderilmiş. Muhtemelen önceki denemeden kalmış. Sayma, devam et.
        const code = (dbErr as { code?: string })?.code;
        if (code !== "P2002") throw dbErr;
      }
    } catch (error) {
      failedCount++;
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Broadcast send error for ${contact.phone}:`, reason);
      try {
        await prisma.message.create({
          data: {
            content: broadcast.message,
            direction: "outgoing",
            phone: contact.phone,
            userId: broadcast.userId,
            contactId: contact.id,
            broadcastId,
            status: "failed",
            failedReason: reason.slice(0, 500),
          },
        });
      } catch (dbErr) {
        const code = (dbErr as { code?: string })?.code;
        if (code !== "P2002") throw dbErr;
      }
    }

    const elapsed = Date.now() - start;
    if (elapsed < minDelayMs) {
      await sleep(minDelayMs - elapsed);
    }
  }

  // Authoritative counts — in-memory sayılar P2002 skip ve crash/retry
  // senaryolarında yanıltıcı olabilir. Truth DB'de: broadcastId'li message
  // satırları.
  const [sentAgg, failedAgg] = await Promise.all([
    prisma.message.count({
      where: { broadcastId, status: "sent" },
    }),
    prisma.message.count({
      where: { broadcastId, status: "failed" },
    }),
  ]);
  const finalSentCount = sentAgg;
  const finalFailedCount = failedAgg;

  // Final status atomic — eğer başka bir süreç aynı anda status'u
  // değiştirdiyse (örn. admin cancel), overwrite etme.
  await prisma.broadcast.updateMany({
    where: { id: broadcastId, status: "sending" },
    data: {
      status: "sent",
      sentCount: finalSentCount,
      failedCount: finalFailedCount,
      completedAt: new Date(),
    },
  });

  dispatchWebhook({
    userId: broadcast.userId,
    event: "broadcast.completed",
    data: {
      broadcastId,
      name: broadcast.name,
      sentCount: finalSentCount,
      failedCount: finalFailedCount,
      total: totalAudience,
    },
  });

  return {
    sentCount: finalSentCount,
    failedCount: finalFailedCount,
    total: totalAudience,
  };
}
