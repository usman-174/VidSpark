-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- CreateTable
CREATE TABLE "evaluation_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "predictedViews" INTEGER NOT NULL,
    "contentScore" DOUBLE PRECISION NOT NULL,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluation_metrics_userId_idx" ON "evaluation_metrics"("userId");

-- CreateIndex
CREATE INDEX "evaluation_metrics_createdAt_idx" ON "evaluation_metrics"("createdAt");

-- AddForeignKey
ALTER TABLE "evaluation_metrics" ADD CONSTRAINT "evaluation_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
