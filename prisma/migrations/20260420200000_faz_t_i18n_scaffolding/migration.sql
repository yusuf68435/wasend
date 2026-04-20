-- Faz T: i18n scaffolding — locale + currency kolonları User'a eklenir.
-- Şimdilik UI tarafında kullanılmıyor; ileride EN/DE/AR + USD/EUR için hazır.

ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr';
ALTER TABLE "User" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TRY';
