-- CreateTable
CREATE TABLE "MetaDataDeletionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaUserId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "MetaDataDeletionRequest_metaUserId_idx" ON "MetaDataDeletionRequest"("metaUserId");

-- CreateIndex
CREATE INDEX "MetaDataDeletionRequest_status_idx" ON "MetaDataDeletionRequest"("status");
