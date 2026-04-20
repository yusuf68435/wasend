-- Faz V10: Support ticket inbox
CREATE TABLE "SupportTicket" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'open',
  "priority"  TEXT NOT NULL DEFAULT 'normal',
  "closedAt"  TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

CREATE TABLE "SupportTicketMessage" (
  "id"         TEXT PRIMARY KEY,
  "ticketId"   TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "authorRole" TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE
);

CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");
