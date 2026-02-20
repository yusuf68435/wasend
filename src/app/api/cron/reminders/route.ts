import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// This endpoint should be called periodically (e.g., every minute via Vercel Cron)
export async function GET(request: NextRequest) {
  // Simple auth for cron - check for secret header
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.NEXTAUTH_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp API ayarları eksik" }, { status: 400 });
  }

  // Find pending reminders that are due
  const now = new Date();
  const pendingReminders = await prisma.reminder.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    include: { contact: true },
  });

  let sentCount = 0;

  for (const reminder of pendingReminders) {
    try {
      await sendWhatsAppMessage({
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
        },
      });

      sentCount++;
    } catch (error) {
      console.error(`Reminder send error for ${reminder.id}:`, error);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "failed" },
      });
    }
  }

  return NextResponse.json({ processed: pendingReminders.length, sent: sentCount });
}
