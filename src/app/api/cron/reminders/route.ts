import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const maxDuration = 60;

// This endpoint should be called periodically (e.g., every minute via Vercel Cron)
export async function GET(request: NextRequest) {
  // Simple auth for cron - check for secret header.
  // Prefers dedicated CRON_SECRET; falls back to NEXTAUTH_SECRET for backwards compatibility.
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp API ayarları eksik" }, { status: 400 });
  }

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

  for (const reminder of pendingReminders) {
    if (reminder.contact.optedOut) {
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
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "failed" },
      });
    }
  }

  return NextResponse.json({
    processed: pendingReminders.length,
    sent: sentCount,
    skipped: skippedCount,
  });
}
