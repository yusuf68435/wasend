import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";

export const maxDuration = 60;

/**
 * Günlük temizlik cron'u — expired/stale kayıtları sil.
 *
 * - FlowSession: expiresAt geçmişse
 * - TeamInvite: expiresAt geçmişse ve usedAt yoksa
 * - User.passwordResetToken: expire olmuşsa null'la (kaydı silme, token'ı iptal et)
 * - User.emailVerifyToken: expire olmuşsa null'la (User.emailVerifiedAt set ise token gereksiz)
 * - AdminAuditLog: 180 günden eski (compliance requirement'a göre ayarla)
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) return auth.response!;

  const now = new Date();
  const oldAuditCutoff = new Date(Date.now() - 180 * 86400000);

  const [flowSessions, teamInvites, resetTokens, verifyTokens, auditLogs] =
    await Promise.all([
      prisma.flowSession.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.teamInvite.deleteMany({
        where: { expiresAt: { lt: now }, usedAt: null },
      }),
      prisma.user.updateMany({
        where: {
          passwordResetExpiresAt: { lt: now },
          passwordResetToken: { not: null },
        },
        data: { passwordResetToken: null, passwordResetExpiresAt: null },
      }),
      prisma.user.updateMany({
        where: {
          emailVerifiedAt: { not: null },
          emailVerifyToken: { not: null },
        },
        data: { emailVerifyToken: null },
      }),
      prisma.adminAuditLog.deleteMany({
        where: { createdAt: { lt: oldAuditCutoff } },
      }),
    ]);

  return NextResponse.json({
    ok: true,
    cleaned: {
      flowSessions: flowSessions.count,
      teamInvites: teamInvites.count,
      passwordResetTokens: resetTokens.count,
      emailVerifyTokens: verifyTokens.count,
      auditLogs: auditLogs.count,
    },
  });
}
