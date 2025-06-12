-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- CreateTable
CREATE TABLE "KeywordUsage" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KeywordUsage_createdAt_idx" ON "KeywordUsage"("createdAt");
