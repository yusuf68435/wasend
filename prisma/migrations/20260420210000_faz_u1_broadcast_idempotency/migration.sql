-- Faz U1: Broadcast idempotency.
-- 1) Broadcast: startedAt / completedAt izleme
-- 2) Message.broadcastId — hangi broadcast'tan üretildi
-- 3) @@unique([broadcastId, contactId]) — aynı broadcast içinde aynı contact'a
--    iki kayıt olamaz. NULL'lar distinct sayıldığı için non-broadcast
--    mesajlar etkilenmez.

ALTER TABLE "Broadcast" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Broadcast" ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "Message" ADD COLUMN "broadcastId" TEXT;

CREATE INDEX "Message_broadcastId_idx" ON "Message"("broadcastId");
CREATE UNIQUE INDEX "Message_broadcastId_contactId_key" ON "Message"("broadcastId", "contactId");
