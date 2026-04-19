import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type WebhookEvent =
  | "message.received"
  | "message.sent"
  | "message.delivered"
  | "message.read"
  | "message.failed"
  | "broadcast.completed"
  | "flow.handoff"
  | "contact.created"
  | "contact.opted_out";

interface DispatchOptions {
  userId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}

// Fire-and-forget. Never throws — logs errors internally.
export async function dispatchWebhook(opts: DispatchOptions): Promise<void> {
  try {
    const hooks = await prisma.outgoingWebhook.findMany({
      where: { userId: opts.userId, isActive: true },
    });
    if (hooks.length === 0) return;

    const body = JSON.stringify({
      event: opts.event,
      timestamp: new Date().toISOString(),
      data: opts.data,
    });

    await Promise.allSettled(
      hooks
        .filter((h) => {
          const events = h.events
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
          return events.includes("*") || events.includes(opts.event);
        })
        .map(async (h) => {
          const signature = crypto
            .createHmac("sha256", h.secret)
            .update(body)
            .digest("hex");
          try {
            await fetch(h.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Wasend-Event": opts.event,
                "X-Wasend-Signature": `sha256=${signature}`,
              },
              body,
            });
          } catch (e) {
            console.error(`Outgoing webhook ${h.id} failed:`, e);
          }
        }),
    );
  } catch (e) {
    console.error("dispatchWebhook error:", e);
  }
}
