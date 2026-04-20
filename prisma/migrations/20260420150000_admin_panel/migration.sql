-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemAnnouncement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "audience" TEXT NOT NULL DEFAULT 'all',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemAnnouncement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnouncementDismissal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnouncementDismissal_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "SystemAnnouncement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" DATETIME,
    "suspendReason" TEXT,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("aiDailyTokenLimit", "aiEnabled", "aiModel", "aiProvider", "aiSystemPrompt", "businessHoursEnd", "businessHoursStart", "businessName", "businessType", "createdAt", "email", "hashedPassword", "id", "name", "offHoursReply", "phone", "plan", "role", "stripeCustomerId", "stripeSubscriptionId", "timezone", "updatedAt", "workDays") SELECT "aiDailyTokenLimit", "aiEnabled", "aiModel", "aiProvider", "aiSystemPrompt", "businessHoursEnd", "businessHoursStart", "businessName", "businessType", "createdAt", "email", "hashedPassword", "id", "name", "offHoursReply", "phone", "plan", "role", "stripeCustomerId", "stripeSubscriptionId", "timezone", "updatedAt", "workDays" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "SystemAnnouncement_isActive_startsAt_idx" ON "SystemAnnouncement"("isActive", "startsAt");

-- CreateIndex
CREATE INDEX "AnnouncementDismissal_userId_idx" ON "AnnouncementDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementDismissal_announcementId_userId_key" ON "AnnouncementDismissal"("announcementId", "userId");

