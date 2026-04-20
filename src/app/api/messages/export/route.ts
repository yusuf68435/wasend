import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Kullanıcının kendi mesaj geçmişini CSV olarak indirir.
 * Opsiyonel ?from=YYYY-MM-DD&to=YYYY-MM-DD filtresi.
 */
export async function GET(request: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: { userId: string; createdAt?: { gte?: Date; lte?: Date } } = {
    userId,
  };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100_000,
    select: {
      id: true,
      direction: true,
      status: true,
      phone: true,
      content: true,
      mediaType: true,
      mediaUrl: true,
      waMessageId: true,
      deliveredAt: true,
      readAt: true,
      failedReason: true,
      createdAt: true,
    },
  });

  const header = [
    "id",
    "direction",
    "status",
    "phone",
    "content",
    "mediaType",
    "mediaUrl",
    "waMessageId",
    "deliveredAt",
    "readAt",
    "failedReason",
    "createdAt",
  ];

  function esc(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [header.join(",")];
  for (const m of messages) {
    lines.push(
      [
        m.id,
        m.direction,
        m.status,
        m.phone,
        m.content,
        m.mediaType,
        m.mediaUrl,
        m.waMessageId,
        m.deliveredAt,
        m.readAt,
        m.failedReason,
        m.createdAt,
      ]
        .map(esc)
        .join(","),
    );
  }

  const filename = `wasend-messages-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
