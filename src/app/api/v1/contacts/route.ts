import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey, getClientIp } from "@/lib/api-key";
import { checkApiKeyRateLimit, apiKeyRateLimitHeaders } from "@/lib/rate-limit";
import { v1ContactCreateSchema, formatZodError } from "@/lib/validation";
import { dispatchWebhook } from "@/lib/outgoing-webhook";
import { prismaErrorToResponse } from "@/lib/prisma-errors";

export async function GET(request: Request) {
  const auth = await verifyApiKey(request.headers.get("authorization"), {
    requireScope: "read",
    ip: getClientIp(request) ?? undefined,
  });
  if (!auth) {
    return NextResponse.json({ error: "Yetkisiz — 'read' scope gerekli" }, { status: 401 });
  }

  const rate = checkApiKeyRateLimit(auth.keyId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit aşıldı", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: apiKeyRateLimitHeaders(rate) },
    );
  }

  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const cursor = url.searchParams.get("cursor");

  const contacts = await prisma.contact.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      phone: true,
      name: true,
      tags: true,
      optedOut: true,
      language: true,
      source: true,
      lastMessageAt: true,
      createdAt: true,
    },
  });

  const hasMore = contacts.length > limit;
  const items = hasMore ? contacts.slice(0, limit) : contacts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ contacts: items, nextCursor });
}

export async function POST(request: Request) {
  const auth = await verifyApiKey(request.headers.get("authorization"), {
    requireScope: "write",
    ip: getClientIp(request) ?? undefined,
  });
  if (!auth) {
    return NextResponse.json({ error: "Yetkisiz — 'write' scope gerekli" }, { status: 401 });
  }

  const rate = checkApiKeyRateLimit(auth.keyId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit aşıldı", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: apiKeyRateLimitHeaders(rate) },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = v1ContactCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        ...parsed.data,
        tags: parsed.data.tags ?? null,
        language: parsed.data.language ?? "tr",
        source: parsed.data.source ?? "api",
        userId: auth.userId,
      },
    });
    dispatchWebhook({
      userId: auth.userId,
      event: "contact.created",
      data: { id: contact.id, phone: contact.phone, name: contact.name },
    });
    return NextResponse.json(contact);
  } catch (error) {
    const prismaResp = prismaErrorToResponse(error, {
      uniqueMessage: "Bu telefon zaten kayıtlı",
    });
    if (prismaResp) return prismaResp;
    const msg = error instanceof Error ? error.message : "Eklenemedi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
