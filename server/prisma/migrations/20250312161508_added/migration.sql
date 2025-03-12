-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '1 hour');
