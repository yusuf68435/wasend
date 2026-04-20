import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processBroadcast } from "@/lib/broadcast-processor";
import { checkBroadcastQuota } from "@/lib/plan-limits";

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { broadcastId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const broadcastId = body?.broadcastId;
  if (!broadcastId || typeof broadcastId !== "string") {
    return NextResponse.json({ error: "Broadcast ID zorunlu" }, { status: 400 });
  }

  const broadcast = await prisma.broadcast.findFirst({
    where: { id: broadcastId, userId },
  });
  if (!broadcast) {
    return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
  }

  // Çift gönderimi engelle — zaten çalışıyorsa veya tamamlanmışsa reddet.
  if (broadcast.status === "sending") {
    return NextResponse.json(
      { error: "Bu kampanya şu an gönderiliyor — lütfen bekleyin" },
      { status: 409 },
    );
  }
  if (broadcast.status === "sent") {
    return NextResponse.json(
      { error: "Bu kampanya zaten gönderildi" },
      { status: 409 },
    );
  }

  const quota = await checkBroadcastQuota(userId);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason, limit: quota.limit, used: quota.used },
      { status: 402 },
    );
  }

  try {
    const result = await processBroadcast(broadcastId);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gönderim hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
