import { prisma } from "@/lib/prisma";
import { getTrustedClientIp } from "@/lib/client-ip";

export interface AuditEntry {
  actorId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        scope: "admin",
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip: entry.ip ?? null,
      },
    });
  } catch (e) {
    console.error("Audit log write failed:", e);
  }
}

/**
 * Faz 14: Kullanıcının kendi resource'unda yaptığı eylem
 * (api-key oluşturma/iptal, webhook ekleme/silme, broadcast tetikleme).
 * Tenant kendi /dashboard/audit'inde sadece scope="tenant" satırlarını
 * görür — admin override'ları (impersonate, plan değiştirme) gizlidir.
 */
export async function logTenantAction(entry: AuditEntry): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        scope: "tenant",
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip: entry.ip ?? null,
      },
    });
  } catch (e) {
    console.error("Tenant audit log write failed:", e);
  }
}

export function getClientIp(headers: Headers): string | null {
  return getTrustedClientIp(headers);
}
