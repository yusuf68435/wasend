-- Faz V3: User.trialEndsAt — admin tarafından trial süre uzatma.
ALTER TABLE "User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
