/*
  Warnings:

  - You are about to drop the `KeywordAnalysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateEnum
CREATE TYPE "ContentOpportunity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- DropForeignKey
ALTER TABLE "KeywordAnalysis" DROP CONSTRAINT "KeywordAnalysis_userId_fkey";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- DropTable
DROP TABLE "KeywordAnalysis";

-- CreateTable
CREATE TABLE "keyword_analysis" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "userId" TEXT,
    "firstAnalyzed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "keyword_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_analysis" (
    "id" TEXT NOT NULL,
    "keywordAnalysisId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "views" INTEGER NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "tags" TEXT[],
    "description" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_insights" (
    "id" TEXT NOT NULL,
    "keywordAnalysisId" TEXT NOT NULL,
    "competitionScore" DOUBLE PRECISION NOT NULL,
    "averageViews" INTEGER NOT NULL,
    "trendDirection" "TrendDirection" NOT NULL,
    "contentOpportunity" "ContentOpportunity" NOT NULL,
    "recentVideoCount" INTEGER NOT NULL,
    "topChannels" TEXT[],
    "aiInsights" TEXT[],
    "analysisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "keyword_analysis_keyword_idx" ON "keyword_analysis"("keyword");

-- CreateIndex
CREATE INDEX "keyword_analysis_userId_idx" ON "keyword_analysis"("userId");

-- CreateIndex
CREATE INDEX "keyword_analysis_lastUpdated_idx" ON "keyword_analysis"("lastUpdated");

-- CreateIndex
CREATE INDEX "video_analysis_keywordAnalysisId_idx" ON "video_analysis"("keywordAnalysisId");

-- CreateIndex
CREATE INDEX "video_analysis_videoId_idx" ON "video_analysis"("videoId");

-- CreateIndex
CREATE INDEX "video_analysis_uploadDate_idx" ON "video_analysis"("uploadDate");

-- CreateIndex
CREATE INDEX "keyword_insights_keywordAnalysisId_idx" ON "keyword_insights"("keywordAnalysisId");

-- CreateIndex
CREATE INDEX "keyword_insights_analysisDate_idx" ON "keyword_insights"("analysisDate");

-- AddForeignKey
ALTER TABLE "keyword_analysis" ADD CONSTRAINT "keyword_analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_analysis" ADD CONSTRAINT "video_analysis_keywordAnalysisId_fkey" FOREIGN KEY ("keywordAnalysisId") REFERENCES "keyword_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_insights" ADD CONSTRAINT "keyword_insights_keywordAnalysisId_fkey" FOREIGN KEY ("keywordAnalysisId") REFERENCES "keyword_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
