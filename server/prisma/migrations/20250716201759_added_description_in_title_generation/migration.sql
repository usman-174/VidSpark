-- AlterTable
ALTER TABLE "GeneratedTitle" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');
