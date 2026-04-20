import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { verifyMetaSignature } from "@/lib/webhook-security";
import { isOptOutMessage, OPT_OUT_CONFIRMATION } from "@/lib/opt-out";
import { isInBusinessHours } from "@/lib/timezone";
import { matchesTrigger, mergeTags } from "@/lib/autoreply-match";
import { generateAIReply, fetchRecentHistory } from "@/lib/ai-agent";
import { runFlows } from "@/lib/flow-engine";
import { dispatchWebhook } from "@/lib/outgoing-webhook";

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
    const rawBody = await request.text();

    // Webhook signature doğrulaması — varsayılan olarak ZORUNLU.
    // Dev'de lokal test için atlamak istiyorsan WEBHOOK_SKIP_SIGNATURE=true + APP_SECRET yok.
    // "APP_SECRET yok → otomatik atla" anti-pattern'i kaldırıldı — prod'a yanlış env
    // yüklenirse artık sessiz güvenlik kaybı yaşanmaz.
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const isProd = process.env.NODE_ENV === "production";
    const explicitSkip = process.env.WEBHOOK_SKIP_SIGNATURE === "true";

    if (!appSecret) {
      if (isProd || !explicitSkip) {
        console.error(
          "CRITICAL: WHATSAPP_APP_SECRET yok — webhook reddedildi. " +
            "Dev'de bilinçli atlamak için WEBHOOK_SKIP_SIGNATURE=true.",
        );
        return NextResponse.json(
          { error: "Webhook not configured" },
          { status: 500 },
        );
      }
      console.warn(
        "DEV: WEBHOOK_SKIP_SIGNATURE=true — imza doğrulaması BİLİNÇLİ atlandı",
      );
    } else {
      const signature = request.headers.get("x-hub-signature-256");
      if (!verifyMetaSignature(rawBody, signature, appSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;

    // Handle delivery/read statuses first
    if (value?.statuses?.length) {
      await handleStatuses(value.statuses);
      return NextResponse.json({ status: "ok" });
    }

    if (!value?.messages?.[0]) {
      return NextResponse.json({ status: "no message" });
    }

    const message = value.messages[0];
    const senderPhone: string = message.from;
    const messageText: string = message.text?.body || "";
    const waIncomingId: string | undefined = message.id;

    // Find the user who owns this phone number ID
    const user = phoneNumberId
      ? await prisma.user.findFirst({ where: { phone: phoneNumberId } })
      : null;

    if (!user) {
      return NextResponse.json({ status: "user not found" });
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: { userId: user.id, phone: senderPhone },
    });

    let isNewContact = false;
    if (!contact) {
      const senderName = value.contacts?.[0]?.profile?.name || senderPhone;
      contact = await prisma.contact.create({
        data: {
          phone: senderPhone,
          name: senderName,
          userId: user.id,
        },
      });
      isNewContact = true;
    }

    // Idempotency: skip if we already saved this Meta message id
    if (waIncomingId) {
      const existing = await prisma.message.findUnique({
        where: { waMessageId: waIncomingId },
      });
      if (existing) {
        return NextResponse.json({ status: "duplicate" });
      }
    }

    // Save incoming message
    await prisma.message.create({
      data: {
        content: messageText,
        direction: "incoming",
        phone: senderPhone,
        userId: user.id,
        contactId: contact.id,
        waMessageId: waIncomingId ?? null,
      },
    });

    // Track most recent activity
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastMessageAt: new Date() },
    });

    dispatchWebhook({
      userId: user.id,
      event: "message.received",
      data: {
        contactId: contact.id,
        phone: senderPhone,
        content: messageText,
        waMessageId: waIncomingId,
        isNewContact,
      },
    });

    if (isNewContact) {
      dispatchWebhook({
        userId: user.id,
        event: "contact.created",
        data: { id: contact.id, phone: contact.phone, name: contact.name },
      });
    }

    const apiToken = process.env.WHATSAPP_API_TOKEN;

    // Opt-out handling — always processed, even if already opted out
    if (isOptOutMessage(messageText)) {
      if (!contact.optedOut) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { optedOut: true, optOutAt: new Date() },
        });
        dispatchWebhook({
          userId: user.id,
          event: "contact.opted_out",
          data: { contactId: contact.id, phone: contact.phone },
        });
      }
      if (apiToken && phoneNumberId) {
        try {
          const result = await sendWhatsAppMessage({
            to: senderPhone,
            message: OPT_OUT_CONFIRMATION,
            phoneNumberId,
            apiToken,
          });
          await prisma.message.create({
            data: {
              content: OPT_OUT_CONFIRMATION,
              direction: "outgoing",
              phone: senderPhone,
              userId: user.id,
              contactId: contact.id,
              status: "sent",
              waMessageId: result.waMessageId,
            },
          });
        } catch (e) {
          console.error("Opt-out confirmation send failed:", e);
        }
      }
      return NextResponse.json({ status: "opted-out" });
    }

    // Never auto-reply to opted-out contacts
    if (contact.optedOut) {
      return NextResponse.json({ status: "contact opted out" });
    }

    // Active flow sessions / flow triggers take priority over auto-replies.
    if (apiToken && phoneNumberId) {
      const flowResult = await runFlows({
        userId: user.id,
        contactId: contact.id,
        contactPhone: senderPhone,
        incomingText: messageText,
        apiToken,
        phoneNumberId,
        newContact: isNewContact,
      });
      if (flowResult.handled) {
        return NextResponse.json({ status: "flow handled" });
      }
    }

    // Check auto-reply rules — ordered by priority desc, then createdAt asc
    const autoReplies = await prisma.autoReply.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const matchedReply = autoReplies.find((rule) =>
      matchesTrigger(messageText, rule.trigger, rule.matchType),
    );

    // Tag auto-assignment: apply assignTags from the matched rule
    if (matchedReply?.assignTags) {
      const merged = mergeTags(contact.tags, matchedReply.assignTags);
      if (merged !== contact.tags) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { tags: merged },
        });
      }
    }

    // Business-hours fallback: if outside hours AND offHoursReply set AND no match,
    // reply with the off-hours message instead.
    const inHours = isInBusinessHours(
      new Date(),
      user.timezone,
      user.businessHoursStart,
      user.businessHoursEnd,
      user.workDays,
    );

    let replyText: string | null = null;
    let aiHandoff = false;
    if (matchedReply) {
      replyText = matchedReply.response;
    } else if (user.aiEnabled) {
      const history = await fetchRecentHistory(user.id, contact.id, 10);
      const ai = await generateAIReply(user, messageText, history);
      if (ai) {
        replyText = ai.text;
        aiHandoff = ai.handoff;
      } else if (!inHours && user.offHoursReply) {
        replyText = user.offHoursReply;
      }
    } else if (!inHours && user.offHoursReply) {
      replyText = user.offHoursReply;
    }

    if (aiHandoff) {
      const merged = mergeTags(contact.tags, "needs-human");
      if (merged !== contact.tags) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { tags: merged },
        });
      }
    }

    if (replyText && apiToken && phoneNumberId) {
      try {
        const result = await sendWhatsAppMessage({
          to: senderPhone,
          message: replyText,
          phoneNumberId,
          apiToken,
        });
        await prisma.message.create({
          data: {
            content: replyText,
            direction: "outgoing",
            phone: senderPhone,
            userId: user.id,
            contactId: contact.id,
            status: "sent",
            waMessageId: result.waMessageId,
          },
        });
      } catch (e) {
        console.error("Auto-reply send failed:", e);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

interface MetaStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{ message?: string; title?: string }>;
}

async function handleStatuses(statuses: MetaStatus[]) {
  for (const s of statuses) {
    if (!s.id || !s.status) continue;

    const ts = s.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date();

    const data: Record<string, unknown> = { status: s.status };
    if (s.status === "delivered") data.deliveredAt = ts;
    else if (s.status === "read") data.readAt = ts;
    else if (s.status === "failed") {
      data.failedReason =
        s.errors?.[0]?.message || s.errors?.[0]?.title || "unknown";
    }

    try {
      const msg = await prisma.message.update({
        where: { waMessageId: s.id },
        data,
        select: { id: true, userId: true, phone: true },
      });

      const eventMap: Record<string, "message.delivered" | "message.read" | "message.failed"> = {
        delivered: "message.delivered",
        read: "message.read",
        failed: "message.failed",
      };
      const event = eventMap[s.status];
      if (event) {
        dispatchWebhook({
          userId: msg.userId,
          event,
          data: { messageId: msg.id, waMessageId: s.id, phone: msg.phone },
        });
      }
    } catch {
      // Message not found locally — Meta may deliver status for an unknown id.
      // Silently skip.
    }
  }
}
