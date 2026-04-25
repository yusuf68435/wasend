import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logTenantAction, getClientIp } from "@/lib/audit";

const GRACE_PERIOD_HOURS = 24;

/**
 * Faz 16: Webhook secret rotation (zero-downtime).
 *
 * POST /api/webhooks-out/[id]/rotate-secret
 *   → { secret: "...", previousSecret: "...", previousSecretValidUntil: ISO }
 *
 * Rotation sonrasında 24 saat boyunca dispatchWebhook her isteğe hem yeni
 * (`X-Wasend-Signature`) hem eski (`X-Wasend-Signature-Previous`) imzayı
 * koyar. Customer endpoint'ini güncelleme süresi boyunca mesajlar düşmez.
 *
 * Pencere bittikten sonra ilk çağrıda otomatik olarak previousSecret null'a
 * düşer (cron'a gerek yok — request-time cleanup).
 *
 * DELETE /api/webhooks-out/[id]/rotate-secret
 *   → grace period'ı manuel sonlandır (eski secret'ı hemen sil)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const hook = await prisma.outgoingWebhook.findFirst({
    where: { id, userId },
    select: { id: true, secret: true, name: true },
  });
  if (!hook) {
    return NextResponse.json({ error: "Webhook bulunamadı" }, { status: 404 });
  }

  const newSecret = crypto.randomBytes(24).toString("hex");
  const validUntil = new Date(
    Date.now() + GRACE_PERIOD_HOURS * 60 * 60 * 1000,
  );

  const updated = await prisma.outgoingWebhook.update({
    where: { id: hook.id },
    data: {
      secret: newSecret,
      previousSecret: hook.secret,
      previousSecretValidUntil: validUntil,
    },
    select: {
      id: true,
      secret: true,
      previousSecret: true,
      previousSecretValidUntil: true,
    },
  });

  void logTenantAction({
    actorId: userId,
    action: "webhook.secret_rotated",
    targetType: "OutgoingWebhook",
    targetId: hook.id,
    details: {
      name: hook.name,
      gracePeriodHours: GRACE_PERIOD_HOURS,
    },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const hook = await prisma.outgoingWebhook.findFirst({
    where: { id, userId },
    select: { id: true, name: true, previousSecret: true },
  });
  if (!hook) {
    return NextResponse.json({ error: "Webhook bulunamadı" }, { status: 404 });
  }
  if (!hook.previousSecret) {
    return NextResponse.json(
      { error: "Aktif rotation penceresi yok" },
      { status: 400 },
    );
  }

  await prisma.outgoingWebhook.update({
    where: { id: hook.id },
    data: { previousSecret: null, previousSecretValidUntil: null },
  });

  void logTenantAction({
    actorId: userId,
    action: "webhook.previous_secret_revoked",
    targetType: "OutgoingWebhook",
    targetId: hook.id,
    details: { name: hook.name },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
