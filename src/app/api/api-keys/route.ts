import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiKeyCreateSchema, formatZodError } from "@/lib/validation";
import { generateApiKey, ALL_SCOPES } from "@/lib/api-key";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id: string } | undefined)?.id;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      lastUsedIp: true,
      usageCount: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
  // scopes: CSV → array
  return NextResponse.json(
    keys.map((k) => ({
      ...k,
      scopes: (k.scopes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })),
  );
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = apiKeyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const { plaintext, prefix, hash } = generateApiKey();
  const expiresAt =
    parsed.data.expiresInDays
      ? new Date(Date.now() + parsed.data.expiresInDays * 86400000)
      : null;

  // Scope normalize: validation şemasından gelen array'i CSV'ye çevir,
  // verilmediyse tüm scope'lar varsayılan (geriye dönük uyumluluk).
  const requestedScopes =
    parsed.data.scopes && parsed.data.scopes.length > 0
      ? Array.from(new Set(parsed.data.scopes))
      : [...ALL_SCOPES];
  const scopesCsv = requestedScopes.join(",");

  const key = await prisma.apiKey.create({
    data: {
      name: parsed.data.name,
      prefix,
      hash,
      scopes: scopesCsv,
      expiresAt,
      userId,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Plaintext key is returned ONCE — never again.
  return NextResponse.json({
    ...key,
    scopes: requestedScopes,
    plaintext,
  });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  await prisma.apiKey.updateMany({
    where: { id, userId },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
