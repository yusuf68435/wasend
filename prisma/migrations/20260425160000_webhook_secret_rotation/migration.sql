-- AlterTable: zero-downtime webhook secret rotation
ALTER TABLE "OutgoingWebhook" ADD COLUMN "previousSecret" TEXT;
ALTER TABLE "OutgoingWebhook" ADD COLUMN "previousSecretValidUntil" TIMESTAMP(3);
