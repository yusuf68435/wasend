-- AlterTable
ALTER TABLE "Message" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "Message" ADD COLUMN "failedReason" TEXT;
ALTER TABLE "Message" ADD COLUMN "readAt" DATETIME;
ALTER TABLE "Message" ADD COLUMN "waMessageId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetTags" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimit" INTEGER NOT NULL DEFAULT 80,
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Broadcast" ("createdAt", "id", "message", "name", "sentCount", "status", "targetTags", "userId") SELECT "createdAt", "id", "message", "name", "sentCount", "status", "targetTags", "userId" FROM "Broadcast";
DROP TABLE "Broadcast";
ALTER TABLE "new_Broadcast" RENAME TO "Broadcast";
CREATE INDEX "Broadcast_userId_idx" ON "Broadcast"("userId");
CREATE INDEX "Broadcast_status_scheduledAt_idx" ON "Broadcast"("status", "scheduledAt");
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tags" TEXT,
    "notes" TEXT,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "optOutAt" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("createdAt", "id", "name", "notes", "phone", "tags", "updatedAt", "userId") SELECT "createdAt", "id", "name", "notes", "phone", "tags", "updatedAt", "userId" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "Contact_userId_optedOut_idx" ON "Contact"("userId", "optedOut");
CREATE UNIQUE INDEX "Contact_userId_phone_key" ON "Contact"("userId", "phone");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("businessName", "businessType", "createdAt", "email", "hashedPassword", "id", "name", "phone", "updatedAt") SELECT "businessName", "businessType", "createdAt", "email", "hashedPassword", "id", "name", "phone", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Message_waMessageId_key" ON "Message"("waMessageId");

