import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminOrNull } from "@/lib/admin-guard";
import { logAdminAction, getClientIp } from "@/lib/audit";

/**
 * Admin retry queue actions.
 *
 * POST /api/admin/retry-queue/[id]
 *   action: "force-retry" → nextRetryAt = now (sweeper bir sonraki tick'te alır)
 *   action: "mark-failed" → status='failed', nextRetryAt=null (kalıcı vazgeç)
 *
 * Sadece status='retry_pending' mesajlarda anlamlı.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSuperAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const action = body.action;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }
  if (message.status !== "retry_pending") {
    return NextResponse.json(
      {
        error: `Mesaj retry_pending durumunda değil (mevcut: ${message.status})`,
      },
      { status: 400 },
    );
  }

  const ip = getClientIp(request.headers);
  if (action === "force-retry") {
    const updated = await prisma.message.update({
      where: { id },
      data: { nextRetryAt: new Date() },
    });
    void logAdminAction({
      actorId: admin.id,
      action: "retry_queue.force_retry",
      targetType: "Message",
      targetId: id,
      details: { ownerUserId: message.userId, retryCount: message.retryCount },
      ip,
    });
    return NextResponse.json({ ok: true, action, message: updated });
  }

  if (action === "mark-failed") {
    const updated = await prisma.message.update({
      where: { id },
      data: {
        status: "failed",
        nextRetryAt: null,
        failedReason: message.failedReason
          ? `${message.failedReason} (admin tarafından kalıcı failed yapıldı)`
          : "Admin tarafından kalıcı failed yapıldı",
      },
    });
    void logAdminAction({
      actorId: admin.id,
      action: "retry_queue.mark_failed",
      targetType: "Message",
      targetId: id,
      details: { ownerUserId: message.userId, retryCount: message.retryCount },
      ip,
    });
    return NextResponse.json({ ok: true, action, message: updated });
  }

  return NextResponse.json(
    { error: "Geçersiz action — 'force-retry' veya 'mark-failed' olmalı" },
    { status: 400 },
  );
}
