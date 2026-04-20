import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";
import { withErrorHandling } from "@/lib/api-error";

/**
 * KVKK/GDPR: kullanıcının tüm verilerini JSON olarak dışa aktarır.
 * User'ın kendi datasını. Admin başkasının export'unu çekemez (ayrı endpoint).
 *
 * Response: application/json, Content-Disposition attachment.
 */
export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const [
    user,
    contacts,
    messages,
    broadcasts,
    autoReplies,
    reminders,
    templates,
    segments,
    flows,
    quickReplies,
    apiKeys,
    outgoingWebhooks,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessType: true,
        phone: true,
        timezone: true,
        plan: true,
        role: true,
        createdAt: true,
        lastSeenAt: true,
      },
    }),
    prisma.contact.findMany({ where: { userId } }),
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50_000,
    }),
    prisma.broadcast.findMany({ where: { userId } }),
    prisma.autoReply.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
    prisma.template.findMany({ where: { userId } }),
    prisma.segment.findMany({ where: { userId } }),
    prisma.flow.findMany({ where: { userId } }),
    prisma.quickReply.findMany({ where: { userId } }),
    prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    }),
    prisma.outgoingWebhook.findMany({
      where: { userId },
      select: { id: true, name: true, url: true, events: true, isActive: true, createdAt: true },
    }),
  ]);

  const bundle = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    notice:
      "KVKK Madde 11 / GDPR Article 20 uyarınca kişisel veri taşınabilirliği kapsamında sağlanmıştır.",
    profile: user,
    counts: {
      contacts: contacts.length,
      messages: messages.length,
      broadcasts: broadcasts.length,
      autoReplies: autoReplies.length,
      reminders: reminders.length,
      templates: templates.length,
      segments: segments.length,
      flows: flows.length,
      quickReplies: quickReplies.length,
      apiKeys: apiKeys.length,
      outgoingWebhooks: outgoingWebhooks.length,
    },
    data: {
      contacts,
      messages,
      broadcasts,
      autoReplies,
      reminders,
      templates,
      segments,
      flows,
      quickReplies,
      apiKeys,
      outgoingWebhooks,
    },
  };

  const filename = `wasend-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
