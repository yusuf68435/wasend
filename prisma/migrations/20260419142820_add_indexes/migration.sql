-- CreateIndex
CREATE INDEX "AutoReply_userId_idx" ON "AutoReply"("userId");

-- CreateIndex
CREATE INDEX "Broadcast_userId_idx" ON "Broadcast"("userId");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_contactId_idx" ON "Message"("contactId");

-- CreateIndex
CREATE INDEX "Reminder_status_scheduledAt_idx" ON "Reminder"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");

-- CreateIndex
CREATE INDEX "Reminder_contactId_idx" ON "Reminder"("contactId");
