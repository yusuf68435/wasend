import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

interface ContextMessage {
  role: "user" | "assistant";
  content: string;
}

interface UserLike {
  id: string;
  businessName: string | null;
  aiEnabled: boolean;
  aiProvider: string;
  aiModel: string;
  aiSystemPrompt: string | null;
  aiDailyTokenLimit: number;
}

export interface AIReplyResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  handoff: boolean;
}

const HANDOFF_MARKER = "#handoff";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Rezervasyon: max_tokens + tipik input tahmini. AI çağrısı öncesi atomik
 *  olarak bunu ekleriz; actual kullanım belli olunca delta ayarlanır. */
const RESERVATION_TOKENS = 800;

/**
 * Token rezervasyonu — eşzamanlı iki istek aynı anda limit'i bypass edemesin
 * diye UPSERT ile INCREMENT atomik yapılır. Eğer rezervasyon sonrası toplam
 * limit'i aşarsa rezervasyon iade edilir ve null döner.
 */
async function reserveTokens(
  userId: string,
  limit: number,
): Promise<{ ok: true } | { ok: false }> {
  const date = todayKey();
  const after = await prisma.aIUsage.upsert({
    where: { userId_date: { userId, date } },
    update: { tokens: { increment: RESERVATION_TOKENS } },
    create: { userId, date, tokens: RESERVATION_TOKENS, costUsd: 0 },
  });
  if (after.tokens > limit) {
    // Rezervasyon iade — başka bir concurrent isteğin hakkını yeme
    await prisma.aIUsage.update({
      where: { userId_date: { userId, date } },
      data: { tokens: { decrement: RESERVATION_TOKENS } },
    });
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Actual usage belli olduktan sonra delta ayarla.
 * actualTokens - RESERVATION_TOKENS kadar increment (negatifse decrement).
 */
async function settleUsage(
  userId: string,
  actualTokens: number,
  costUsd: number,
): Promise<void> {
  const date = todayKey();
  const delta = actualTokens - RESERVATION_TOKENS;
  await prisma.aIUsage.update({
    where: { userId_date: { userId, date } },
    data: {
      tokens: { increment: delta },
      costUsd: { increment: costUsd },
    },
  });
}

/** Rezervasyonun iadesi — AI çağrısı tamamen başarısız olursa kullanılır. */
async function refundReservation(userId: string): Promise<void> {
  const date = todayKey();
  await prisma.aIUsage
    .update({
      where: { userId_date: { userId, date } },
      data: { tokens: { decrement: RESERVATION_TOKENS } },
    })
    .catch(() => undefined);
}

function buildSystemPrompt(user: UserLike): string {
  const base =
    user.aiSystemPrompt?.trim() ||
    `Sen ${user.businessName || "bu işletme"} için müşteri hizmetleri asistanısın. ` +
      "Sadece işletmeyle ilgili somut sorulara (ürün, fiyat, saat, randevu, adres) kısa ve net cevap ver. " +
      "Bilmediğin veya belirsiz bir konu olursa 'bir temsilcimiz en kısa sürede dönüş yapacak' de ve cevabın sonuna #handoff yaz. " +
      "Hiçbir zaman fiyat, stok, randevu uydurma. Sohbeti kısa tut (1-3 cümle).";
  return base;
}

export async function generateAIReply(
  user: UserLike,
  currentMessage: string,
  history: ContextMessage[],
): Promise<AIReplyResult | null> {
  if (!user.aiEnabled) return null;
  if (user.aiProvider !== "anthropic") return null;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Atomik rezervasyon — concurrent istekler limit'i delemez
  const reservation = await reserveTokens(user.id, user.aiDailyTokenLimit);
  if (!reservation.ok) return null;

  const client = new Anthropic({ apiKey });

  const recent = history.slice(-10);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...recent,
    { role: "user", content: currentMessage },
  ];

  try {
    const resp = await client.messages.create({
      model: user.aiModel || "claude-haiku-4-5",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(user),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const inputTokens = resp.usage.input_tokens;
    const outputTokens = resp.usage.output_tokens;

    // Haiku 4.5 rough pricing: $1/MTok input, $5/MTok output
    const costUsd = (inputTokens / 1_000_000) * 1 + (outputTokens / 1_000_000) * 5;
    await settleUsage(user.id, inputTokens + outputTokens, costUsd);

    const handoff = text.toLowerCase().includes(HANDOFF_MARKER);
    const cleanText = text.replaceAll(HANDOFF_MARKER, "").trim();

    return {
      text: cleanText || "Size en kısa sürede dönüş yapacağız.",
      inputTokens,
      outputTokens,
      handoff,
    };
  } catch (e) {
    console.error("AI agent error:", e);
    await refundReservation(user.id);
    return null;
  }
}

export async function fetchRecentHistory(
  userId: string,
  contactId: string,
  limit = 10,
): Promise<ContextMessage[]> {
  const msgs = await prisma.message.findMany({
    where: { userId, contactId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { content: true, direction: true },
  });
  return msgs
    .reverse()
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.direction === "incoming" ? "user" : "assistant",
      content: m.content,
    }));
}
