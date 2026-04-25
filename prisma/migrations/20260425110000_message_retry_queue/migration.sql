-- AlterTable
ALTER TABLE "Message" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Message" ADD COLUMN "nextRetryAt" DATETIME;

-- CreateIndex (cron retry sweeper için)
CREATE INDEX "Message_status_nextRetryAt_idx" ON "Message"("status", "nextRetryAt");
