import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-auth";

/**
 * Son 20 aktivite (recent events) — dashboard feed.
 * Kaynaklar: son 10 gelen mesaj + son 5 gönderilen broadcast + son 5 yeni contact.
 * Zaman sırasına göre birleşir.
 */

interface ActivityItem {
  type: "message_in" | "message_out" | "broadcast" | "contact" | "flow_trigger";
  time: string;
  title: string;
  detail?: string;
  href?: string;
}

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const [incomingMsgs, broadcasts, newContacts] = await Promise.all([
    prisma.message.findMany({
      where: { userId, direction: "incoming" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, phone: true, content: true, createdAt: true },
    }),
    prisma.broadcast.findMany({
      where: { userId, status: "sent" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        sentCount: true,
        failedCount: true,
        completedAt: true,
      },
    }),
    prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, phone: true, createdAt: true },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const m of incomingMsgs) {
    items.push({
      type: "message_in",
      time: m.createdAt.toISOString(),
      title: m.phone,
      detail: m.content.slice(0, 60),
      href: "/dashboard/messages",
    });
  }

  for (const b of broadcasts) {
    if (!b.completedAt) continue;
    items.push({
      type: "broadcast",
      time: b.completedAt.toISOString(),
      title: b.name,
      detail: `${b.sentCount} gönderildi${b.failedCount ? ` · ${b.failedCount} başarısız` : ""}`,
      href: "/dashboard/broadcasts",
    });
  }

  for (const c of newContacts) {
    items.push({
      type: "contact",
      time: c.createdAt.toISOString(),
      title: c.name,
      detail: c.phone,
      href: "/dashboard/contacts",
    });
  }

  items.sort((a, b) => b.time.localeCompare(a.time));

  return NextResponse.json({ items: items.slice(0, 20) });
}
