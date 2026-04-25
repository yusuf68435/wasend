import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  type MediaType,
} from "@/lib/whatsapp";
import { verifyCronAuth } from "@/lib/cron-auth";
import { resolveWACredentials } from "@/lib/wa-credentials";
import { decideRetry } from "@/lib/message-retry";

export const maxDuration = 60;

const MEDIA_TYPES: readonly MediaType[] = [
  "image",
  "document",
  "video",
  "audio",
];

const BATCH_SIZE = 50;

/**
 * Faz 4 retry sweeper.
 *
 * Her dakika çalışır. status='retry_pending' AND nextRetryAt <= now() olan
 * mesajları bulur, tekrar göndermeyi dener:
 *   - Başarı  → status='sent', waMessageId set, nextRetryAt=null
 *   - Geçici  → retryCount++, nextRetryAt güncellenir, status='retry_pending'
 *   - Kalıcı  → status='failed', nextRetryAt=null
 *   - Max     → status='failed', nextRetryAt=null
 *
 * BATCH_SIZE=50 — bir cron tick'inde max 50 mesaj. Daha fazlası varsa sıradaki
 * tick'e bırakılır (60 sn de zaten gönderme + DB write için yeterli zaman).
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) return auth.response!;

  const now = new Date();
  const due = await prisma.message.findMany({
    where: {
      status: "retry_pending",
      nextRetryAt: { lte: now },
    },
    orderBy: { nextRetryAt: "asc" },
    take: BATCH_SIZE,
  });

  let sentCount = 0;
  let retryCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // Per-user credential cache — aynı tick'te aynı user için tekrar lookup yapma
  const credCache = new Map<
    string,
    { apiToken: string | null; phoneNumberId: string | null }
  >();
  async function getCreds(userId: string) {
    const cached = credCache.get(userId);
    if (cached) return cached;
    const { apiToken, phoneNumberId } = await resolveWACredentials(userId);
    const v = { apiToken, phoneNumberId };
    credCache.set(userId, v);
    return v;
  }

  for (const message of due) {
    const { apiToken, phoneNumberId } = await getCreds(message.userId);
    if (!apiToken || !phoneNumberId) {
      // Credentials gitmiş — kalıcı failed yap
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "failed",
          failedReason:
            "WhatsApp API ayarları bulunamadı (retry sırasında kaldırılmış olabilir)",
          nextRetryAt: null,
        },
      });
      skippedCount++;
      continue;
    }

    const mediaType = MEDIA_TYPES.includes(message.mediaType as MediaType)
      ? (message.mediaType as MediaType)
      : null;
    const useMedia = mediaType && message.mediaUrl;

    try {
      const result = useMedia
        ? await sendWhatsAppMedia({
            to: message.phone,
            mediaType: mediaType as MediaType,
            mediaUrl: message.mediaUrl as string,
            caption: message.caption ?? message.content,
            phoneNumberId,
            apiToken,
          })
        : await sendWhatsAppMessage({
            to: message.phone,
            message: message.content,
            phoneNumberId,
            apiToken,
          });

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "sent",
          waMessageId: result.waMessageId,
          nextRetryAt: null,
          failedReason: null,
        },
      });
      sentCount++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        `Retry send error for message ${message.id} (${message.phone}):`,
        reason,
      );
      const decision = decideRetry(message.retryCount, reason, now);
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: decision.status,
          retryCount: decision.retryCount,
          nextRetryAt: decision.nextRetryAt,
          failedReason: reason.slice(0, 500),
        },
      });
      if (decision.status === "failed") {
        failedCount++;
      } else {
        retryCount++;
      }
    }
  }

  return NextResponse.json({
    processed: due.length,
    sent: sentCount,
    retried: retryCount,
    failed: failedCount,
    skipped: skippedCount,
  });
}
