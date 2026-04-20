-- DropIndex
DROP INDEX "Reminder_userId_idx";

-- CreateIndex
CREATE INDEX "Message_userId_status_createdAt_idx" ON "Message"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Message_userId_direction_createdAt_idx" ON "Message"("userId", "direction", "createdAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_status_scheduledAt_idx" ON "Reminder"("userId", "status", "scheduledAt");

