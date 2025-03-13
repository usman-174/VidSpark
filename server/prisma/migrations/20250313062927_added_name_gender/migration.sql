-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "gender" SET DEFAULT 'MALE';
