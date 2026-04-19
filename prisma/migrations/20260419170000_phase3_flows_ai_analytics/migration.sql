-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerValue" TEXT,
    "nodes" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "currentNodeId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FlowSession_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "read" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "incomingCount" INTEGER NOT NULL DEFAULT 0,
    "newContacts" INTEGER NOT NULL DEFAULT 0,
    "optOuts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuickReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shortcut" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuickReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "phone" TEXT,
    "businessName" TEXT,
    "businessType" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "workDays" TEXT,
    "offHoursReply" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "aiModel" TEXT NOT NULL DEFAULT 'claude-haiku-4-5',
    "aiSystemPrompt" TEXT,
    "aiDailyTokenLimit" INTEGER NOT NULL DEFAULT 100000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("businessHoursEnd", "businessHoursStart", "businessName", "businessType", "createdAt", "email", "hashedPassword", "id", "name", "offHoursReply", "phone", "timezone", "updatedAt", "workDays") SELECT "businessHoursEnd", "businessHoursStart", "businessName", "businessType", "createdAt", "email", "hashedPassword", "id", "name", "offHoursReply", "phone", "timezone", "updatedAt", "workDays" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Flow_userId_idx" ON "Flow"("userId");

-- CreateIndex
CREATE INDEX "Flow_userId_isActive_idx" ON "Flow"("userId", "isActive");

-- CreateIndex
CREATE INDEX "FlowSession_userId_idx" ON "FlowSession"("userId");

-- CreateIndex
CREATE INDEX "FlowSession_expiresAt_idx" ON "FlowSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FlowSession_contactId_key" ON "FlowSession"("contactId");

-- CreateIndex
CREATE INDEX "AIUsage_userId_idx" ON "AIUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsage_userId_date_key" ON "AIUsage"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyMetric_userId_date_idx" ON "DailyMetric"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_userId_date_key" ON "DailyMetric"("userId", "date");

-- CreateIndex
CREATE INDEX "QuickReply_userId_idx" ON "QuickReply"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickReply_userId_shortcut_key" ON "QuickReply"("userId", "shortcut");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite"("token");

-- CreateIndex
CREATE INDEX "TeamInvite_userId_idx" ON "TeamInvite"("userId");

-- CreateIndex
CREATE INDEX "TeamInvite_email_idx" ON "TeamInvite"("email");

