-- AlterTable: tenant-level audit ayrımı için scope kolonu
ALTER TABLE "AdminAuditLog" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'admin';

-- CreateIndex
CREATE INDEX "AdminAuditLog_scope_actorId_createdAt_idx" ON "AdminAuditLog"("scope", "actorId", "createdAt");
