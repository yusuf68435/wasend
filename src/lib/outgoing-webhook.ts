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

// Faz 8: payload truncate threshold (sensitive data çıkmaması ve DB
// büyümemesi için). 2KB üzeri "[truncated]" işaretiyle kesilir.
const PAYLOAD_PREVIEW_MAX = 2048;

// Faz 8: bir delivery attempt'inin sonucunu DB'ye yaz. Fire-and-forget —
// log yazımı dispatch akışını bloklamasın.
async function logDelivery(
  hookId: string,
  event: string,
  status: "success" | "failed" | "timeout" | "circuit_open",
  fields: {
    statusCode?: number | null;
    responseTimeMs?: number | null;
    errorMessage?: string | null;
    payloadPreview?: string | null;
  },
): Promise<void> {
  try {
    const errorMessage = fields.errorMessage?.slice(0, 500) ?? null;
    const payloadPreview = fields.payloadPreview
      ? fields.payloadPreview.length > PAYLOAD_PREVIEW_MAX
        ? `${fields.payloadPreview.slice(0, PAYLOAD_PREVIEW_MAX)}…[truncated]`
        : fields.payloadPreview
      : null;

    await prisma.$transaction([
      prisma.webhookDelivery.create({
        data: {
          webhookId: hookId,
          event,
          status,
          statusCode: fields.statusCode ?? null,
          responseTimeMs: fields.responseTimeMs ?? null,
          errorMessage,
          payloadPreview,
        },
      }),
      prisma.outgoingWebhook.update({
        where: { id: hookId },
        data: {
          lastDeliveredAt: new Date(),
          lastStatusCode: fields.statusCode ?? null,
          lastError:
            status === "success"
              ? null
              : errorMessage ?? `status=${status}`,
        },
      }),
    ]);
  } catch (e) {
    console.error(`logDelivery failed for ${hookId}:`, e);
  }
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
          if (isCircuitOpen(h.id)) {
            // Faz 8: circuit açıkken de log tut — customer "neden gitmedi"
            // sorusunu cevaplayabilsin.
            void logDelivery(h.id, opts.event, "circuit_open", {
              errorMessage:
                "Circuit breaker açık — son 60sn içinde 5+ başarısızlık",
              payloadPreview: body,
            });
            return false;
          }
          return true;
        })
        .map(async (h) => {
          const signature = crypto
            .createHmac("sha256", h.secret)
            .update(body)
            .digest("hex");
          const startedAt = Date.now();
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
            const responseTimeMs = Date.now() - startedAt;
            if (res.ok) {
              recordSuccess(h.id);
              void logDelivery(h.id, opts.event, "success", {
                statusCode: res.status,
                responseTimeMs,
                payloadPreview: body,
              });
            } else {
              recordFailure(h.id);
              void logDelivery(h.id, opts.event, "failed", {
                statusCode: res.status,
                responseTimeMs,
                errorMessage: `HTTP ${res.status}`,
                payloadPreview: body,
              });
            }
          } catch (e) {
            const responseTimeMs = Date.now() - startedAt;
            recordFailure(h.id);
            const errName = e instanceof Error ? e.name : String(e);
            const errMsg = e instanceof Error ? e.message : String(e);
            console.error(`Outgoing webhook ${h.id} failed:`, errName);
            void logDelivery(
              h.id,
              opts.event,
              errName === "TimeoutError" || /timeout/i.test(errMsg)
                ? "timeout"
                : "failed",
              {
                responseTimeMs,
                errorMessage: errMsg,
                payloadPreview: body,
              },
            );
          }
        }),
    );
  } catch (e) {
    console.error("dispatchWebhook error:", e);
  }
}
