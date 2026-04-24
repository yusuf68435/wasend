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

/**
 * Circuit breaker: başarısız webhook'lar socket/event-loop'u yemesin.
 * Bir webhook URL son 60 saniyede 5+ kez başarısız olduysa 5 dakika boyunca
 * es geç. Böylece müşterinin ölü webhook'u diğer tenant'ları yavaşlatmaz
 * ve recovery sonrası otomatik devreye girer.
 */
const FAILURE_WINDOW_MS = 60_000;
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 5 * 60_000;

interface BreakerState {
  failures: number[]; // timestamp'ler
  openUntil: number; // ms, 0 = kapalı
}
const breaker = new Map<string, BreakerState>();

function isCircuitOpen(hookId: string): boolean {
  const state = breaker.get(hookId);
  if (!state) return false;
  const now = Date.now();
  if (state.openUntil > now) return true;
  // Pencereden çıkmış failure'ları temizle
  state.failures = state.failures.filter((t) => now - t < FAILURE_WINDOW_MS);
  if (state.failures.length === 0) breaker.delete(hookId);
  return false;
}

function recordFailure(hookId: string): void {
  const now = Date.now();
  const state = breaker.get(hookId) || { failures: [], openUntil: 0 };
  state.failures.push(now);
  state.failures = state.failures.filter((t) => now - t < FAILURE_WINDOW_MS);
  if (state.failures.length >= FAILURE_THRESHOLD) {
    state.openUntil = now + COOLDOWN_MS;
    state.failures = [];
    console.warn(
      `[webhook] circuit opened for ${hookId} — cooldown ${COOLDOWN_MS / 1000}s`,
    );
  }
  breaker.set(hookId, state);
}

function recordSuccess(hookId: string): void {
  breaker.delete(hookId);
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
          const subscribed = events.includes("*") || events.includes(opts.event);
          if (!subscribed) return false;
          if (isCircuitOpen(h.id)) return false;
          return true;
        })
        .map(async (h) => {
          const signature = crypto
            .createHmac("sha256", h.secret)
            .update(body)
            .digest("hex");
          try {
            // 5 sn timeout — yavaş webhook endpoint broadcast processor'ı
            // yavaşlatmasın (Promise.allSettled dış sarmalayıcısıyla birlikte)
            const res = await fetch(h.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Wasend-Event": opts.event,
                "X-Wasend-Signature": `sha256=${signature}`,
              },
              body,
              signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
              recordSuccess(h.id);
            } else {
              recordFailure(h.id);
            }
          } catch (e) {
            recordFailure(h.id);
            console.error(
              `Outgoing webhook ${h.id} failed:`,
              e instanceof Error ? e.name : String(e),
            );
          }
        }),
    );
  } catch (e) {
    console.error("dispatchWebhook error:", e);
  }
}
