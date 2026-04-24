-- Onboarding wizard: track per-user completion state
-- onboardedAt NULL → kullanıcı wizard'ı tamamlamamış, /onboarding'e redirect
-- onboardingStep: 0=başlamadı, 1=business info, 2=WhatsApp phone, 3=test, 4=done
-- Existing users (created before this migration) → step=4, onboardedAt=createdAt
--   böylece mevcut müşteriler wizard'a düşmez, sadece yeni kayıtlar girer.

ALTER TABLE "User" ADD COLUMN "onboardedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;

-- Mevcut kullanıcıları onboarded olarak işaretle (feature flag gibi)
UPDATE "User" SET "onboardedAt" = "createdAt", "onboardingStep" = 4;
