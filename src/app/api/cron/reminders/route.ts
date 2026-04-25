import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { verifyCronAuth } from "@/lib/cron-auth";
import { resolveWACredentials } from "@/lib/wa-credentials";
import { decideRetry } from "@/lib/message-retry";

export const maxDuration = 60;

// This endpoint should be called periodically (e.g., every minute via Vercel Cron)
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) return auth.response!;

  // Find pending reminders whose contacts haven't opted out
  const now = new Date();
  const pendingReminders = await prisma.reminder.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
      contact: { optedOut: false },
    },
    include: { contact: true },
  });

  let sentCount = 0;
  let skippedCount = 0;

  // Per-user credential cache — aynı cron'da aynı user defalarca lookup'ı önler.
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

  for (const reminder of pendingReminders) {
    if (reminder.contact.optedOut) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "skipped" },
      });
      skippedCount++;
      continue;
    }

    const { apiToken, phoneNumberId } = await getCreds(reminder.userId);
    if (!apiToken || !phoneNumberId) {
      // Bu user'ın WA'sı yapılandırılmamış — skip et, hata verme.
      console.warn(
        `Reminder ${reminder.id} skipped: userId=${reminder.userId} WA credentials missing`,
      );
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "skipped" },
      });
      skippedCount++;
      continue;
    }

    try {
      const result = await sendWhatsAppMessage({
        to: reminder.contact.phone,
        message: reminder.message,
        phoneNumberId,
        apiToken,
      });

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "sent" },
      });

      await prisma.message.create({
        data: {
          content: reminder.message,
          direction: "outgoing",
          phone: reminder.contact.phone,
          userId: reminder.userId,
          contactId: reminder.contactId,
          status: "sent",
          waMessageId: result.waMessageId,
        },
      });

      sentCount++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Reminder send error for ${reminder.id}:`, reason);
      // Faz 5: transient hata → Message{retry_pending} oluştur, retry sweeper
      // sonra deneyecek; reminder "sent" olur (tetiklendi, daha fazla iş yok).
      // Permanent hata → reminder='failed', Message='failed'.
      const decision = decideRetry(0, reason);
      await prisma.message.create({
        data: {
          content: reminder.message,
          direction: "outgoing",
          phone: reminder.contact.phone,
          userId: reminder.userId,
          contactId: reminder.contactId,
          status: decision.status,
          failedReason: reason.slice(0, 500),
          retryCount: decision.retryCount,
          nextRetryAt: decision.nextRetryAt,
        },
      });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          // retry_pending → reminder işini yaptı, queue'ya devretti
          status: decision.status === "retry_pending" ? "sent" : "failed",
        },
      });
    }
  }

  return NextResponse.json({
    processed: pendingReminders.length,
    sent: sentCount,
    skipped: skippedCount,
  });
}
