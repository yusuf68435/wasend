-- Faz V6: Payment tablosu (iyzico)
CREATE TABLE "Payment" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL,
  "plan"          TEXT NOT NULL,
  "amount"        INTEGER NOT NULL,
  "currency"      TEXT NOT NULL DEFAULT 'TRY',
  "status"        TEXT NOT NULL DEFAULT 'pending',
  "provider"      TEXT NOT NULL DEFAULT 'iyzico',
  "providerRefId" TEXT,
  "providerToken" TEXT,
  "errorMessage"  TEXT,
  "paidAt"        TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_providerRefId_idx" ON "Payment"("providerRefId");
