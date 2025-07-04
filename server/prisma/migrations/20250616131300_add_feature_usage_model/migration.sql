/*
  Warnings:

  - You are about to drop the column `count` on the `FeatureUsage` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `FeatureUsage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FeatureUsage" DROP COLUMN "count",
DROP COLUMN "createdAt",
ADD COLUMN     "totalCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- CreateTable
CREATE TABLE "FeatureUsageLog" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUsageLog_pkey" PRIMARY KEY ("id")
);
