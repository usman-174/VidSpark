/*
  Warnings:

  - You are about to drop the `NewsIdea` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- DropTable
DROP TABLE "NewsIdea";

-- CreateTable
CREATE TABLE "NewsIdeaTemp" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "pubDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsIdeaTemp_pkey" PRIMARY KEY ("id")
);
