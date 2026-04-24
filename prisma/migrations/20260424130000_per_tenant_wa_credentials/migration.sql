-- Phase C: Per-tenant WhatsApp credentials (BYO token).
-- Mevcut firmalar global env kullanmaya devam eder (backward compat).
-- Yeni alanlar:
--   waApiToken    — AES-256-GCM encrypted Meta Graph API token
--   waAppSecret   — AES-256-GCM encrypted Meta App secret (webhook signature)
--   waVerifyToken — webhook hub.verify_token (per-tenant unique, lookup için)
--   waWabaId      — WhatsApp Business Account ID

ALTER TABLE "User" ADD COLUMN "waApiToken" TEXT;
ALTER TABLE "User" ADD COLUMN "waAppSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "waVerifyToken" TEXT;
ALTER TABLE "User" ADD COLUMN "waWabaId" TEXT;

CREATE UNIQUE INDEX "User_waVerifyToken_key" ON "User"("waVerifyToken");
