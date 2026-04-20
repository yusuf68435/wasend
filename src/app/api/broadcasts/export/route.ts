import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const broadcasts = await prisma.broadcast.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      message: true,
      targetTags: true,
      status: true,
      sentCount: true,
      failedCount: true,
      scheduledAt: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });

  const header = [
    "id",
    "name",
    "message",
    "targetTags",
    "status",
    "sentCount",
    "failedCount",
    "scheduledAt",
    "startedAt",
    "completedAt",
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
  for (const b of broadcasts) {
    lines.push(
      [
        b.id,
        b.name,
        b.message,
        b.targetTags,
        b.status,
        b.sentCount,
        b.failedCount,
        b.scheduledAt,
        b.startedAt,
        b.completedAt,
        b.createdAt,
      ]
        .map(esc)
        .join(","),
    );
  }

  const filename = `wasend-broadcasts-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
