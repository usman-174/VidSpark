-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- CreateTable
CREATE TABLE "ideas_of_the_day" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalNews" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "keywords" TEXT[],
    "pubDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_of_the_day_pkey" PRIMARY KEY ("id")
);
