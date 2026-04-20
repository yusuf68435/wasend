-- Faz V4: FeatureFlag tablosu
CREATE TABLE "FeatureFlag" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "rolloutPct" INTEGER NOT NULL DEFAULT 0,
  "targetPlans" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");
