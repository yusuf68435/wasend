-- AlterTable: scope-based access control + audit fields
ALTER TABLE "ApiKey" ADD COLUMN "scopes" TEXT NOT NULL DEFAULT 'read,send,write';
ALTER TABLE "ApiKey" ADD COLUMN "lastUsedIp" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0;
