import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryWebhookDelivery } from "@/lib/outgoing-webhook";

/**
 * Faz 11: Manuel retry — sadece webhook sahibi tetikleyebilir.
 * POST /api/webhooks-out/[id]/deliveries/[deliveryId]/retry
 *   → { ok, status, newDeliveryId? }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, deliveryId } = await params;

  // Delivery'nin user'a ait webhook'a bağlı olduğunu doğrula
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    select: { webhookId: true, webhook: { select: { userId: true } } },
  });
  if (!delivery || delivery.webhookId !== id || delivery.webhook.userId !== userId) {
    return NextResponse.json({ error: "Delivery bulunamadı" }, { status: 404 });
  }

  const result = await retryWebhookDelivery(deliveryId);
  if (!result.ok && result.error && !result.newDeliveryId) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
