-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN "mediaType" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "mediaUrl" TEXT;
ALTER TABLE "Broadcast" ADD COLUMN "segmentId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "caption" TEXT;
ALTER TABLE "Message" ADD COLUMN "mediaId" TEXT;
ALTER TABLE "Message" ADD COLUMN "mediaType" TEXT;
ALTER TABLE "Message" ADD COLUMN "mediaUrl" TEXT;

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'tr',
    "category" TEXT NOT NULL DEFAULT 'UTILITY',
    "bodyText" TEXT NOT NULL,
    "variables" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metaId" TEXT,
    "rejection" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Segment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutoReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trigger" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "matchType" TEXT NOT NULL DEFAULT 'contains',
    "assignTags" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutoReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutoReply" ("createdAt", "id", "isActive", "response", "trigger", "updatedAt", "userId") SELECT "createdAt", "id", "isActive", "response", "trigger", "updatedAt", "userId" FROM "AutoReply";
DROP TABLE "AutoReply";
ALTER TABLE "new_AutoReply" RENAME TO "AutoReply";
CREATE INDEX "AutoReply_userId_idx" ON "AutoReply"("userId");
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tags" TEXT,
    "notes" TEXT,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "optOutAt" DATETIME,
    "customFields" TEXT,
    "language" TEXT NOT NULL DEFAULT 'tr',
    "source" TEXT,
    "lastMessageAt" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("createdAt", "id", "name", "notes", "optOutAt", "optedOut", "phone", "tags", "updatedAt", "userId") SELECT "createdAt", "id", "name", "notes", "optOutAt", "optedOut", "phone", "tags", "updatedAt", "userId" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "Contact_userId_optedOut_idx" ON "Contact"("userId", "optedOut");
CREATE INDEX "Contact_userId_lastMessageAt_idx" ON "Contact"("userId", "lastMessageAt");
CREATE UNIQUE INDEX "Contact_userId_phone_key" ON "Contact"("userId", "phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_userId_name_language_key" ON "Template"("userId", "name", "language");

-- CreateIndex
CREATE INDEX "Segment_userId_idx" ON "Segment"("userId");

