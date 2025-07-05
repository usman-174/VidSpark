/*
  Warnings:

  - You are about to drop the `DailyInsights` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NewsIdeaTemp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PopularContent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemMetrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserEngagement` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[feature]` on the table `FeatureUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "UserEngagement" DROP CONSTRAINT "UserEngagement_userId_fkey";

-- AlterTable
ALTER TABLE "FeatureUsage" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "FeatureUsageLog" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- DropTable
DROP TABLE "DailyInsights";

-- DropTable
DROP TABLE "NewsIdeaTemp";

-- DropTable
DROP TABLE "PopularContent";

-- DropTable
DROP TABLE "SystemMetrics";

-- DropTable
DROP TABLE "UserEngagement";

-- CreateTable
CREATE TABLE "daily_insights" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "keywordAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "sentimentAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "titleGenerationCount" INTEGER NOT NULL DEFAULT 0,
    "evaluationMetricCount" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalTitlesGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalKeywordsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "totalVideosAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_engagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keywordAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "sentimentAnalysisCount" INTEGER NOT NULL DEFAULT 0,
    "titleGenerationCount" INTEGER NOT NULL DEFAULT 0,
    "evaluationMetricCount" INTEGER NOT NULL DEFAULT 0,
    "firstUsedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "avgSessionLength" DOUBLE PRECISION,
    "favoriteFeature" "FeatureType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "feature" "FeatureType",
    "successRate" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "cpuUsage" DOUBLE PRECISION,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popular_content" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popular_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_insights_date_key" ON "daily_insights"("date");

-- CreateIndex
CREATE UNIQUE INDEX "user_engagement_userId_key" ON "user_engagement"("userId");

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "system_metrics_feature_idx" ON "system_metrics"("feature");

-- CreateIndex
CREATE INDEX "popular_content_contentType_idx" ON "popular_content"("contentType");

-- CreateIndex
CREATE INDEX "popular_content_usageCount_idx" ON "popular_content"("usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "popular_content_contentType_content_key" ON "popular_content"("contentType", "content");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsage_feature_key" ON "FeatureUsage"("feature");

-- AddForeignKey
ALTER TABLE "user_engagement" ADD CONSTRAINT "user_engagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
