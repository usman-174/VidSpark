-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "FeatureType" AS ENUM ('KEYWORD_ANALYSIS', 'SENTIMENT_ANALYSIS', 'TITLE_GENERATION', 'EVALUATION_METRIC', 'USER_AUTHENTICATION', 'PAYMENT_PROCESSING', 'ADMIN_DASHBOARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContentType" AS ENUM ('KEYWORD', 'TITLE', 'VIDEO_URL', 'TAG', 'DESCRIPTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create UserEngagement table if it doesn't exist
CREATE TABLE IF NOT EXISTS "UserEngagement" (
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

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_userId_key" UNIQUE ("userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DailyInsights table if it doesn't exist
CREATE TABLE IF NOT EXISTS "DailyInsights" (
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

    CONSTRAINT "DailyInsights_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "DailyInsights" ADD CONSTRAINT "DailyInsights_date_key" UNIQUE ("date");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SystemMetrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SystemMetrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "feature" "FeatureType",
    "successRate" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "cpuUsage" DOUBLE PRECISION,

    CONSTRAINT "SystemMetrics_pkey" PRIMARY KEY ("id")
);

-- Create PopularContent table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PopularContent" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopularContent_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "PopularContent" ADD CONSTRAINT "PopularContent_contentType_content_key" UNIQUE ("contentType", "content");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Handle FeatureUsage table enum conversion
DO $$ 
BEGIN
    -- Check if the feature column is already an enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FeatureUsage' 
        AND column_name = 'feature' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Column is already an enum, do nothing
        NULL;
    ELSE
        -- Convert string column to enum
        ALTER TABLE "FeatureUsage" ADD COLUMN "feature_new" "FeatureType";
        
        UPDATE "FeatureUsage" SET "feature_new" = 
          CASE 
            WHEN UPPER("feature") LIKE '%KEYWORD%' THEN 'KEYWORD_ANALYSIS'::"FeatureType"
            WHEN UPPER("feature") LIKE '%SENTIMENT%' THEN 'SENTIMENT_ANALYSIS'::"FeatureType"
            WHEN UPPER("feature") LIKE '%TITLE%' THEN 'TITLE_GENERATION'::"FeatureType"
            WHEN UPPER("feature") LIKE '%EVALUATION%' THEN 'EVALUATION_METRIC'::"FeatureType"
            WHEN UPPER("feature") LIKE '%AUTH%' THEN 'USER_AUTHENTICATION'::"FeatureType"
            WHEN UPPER("feature") LIKE '%PAYMENT%' THEN 'PAYMENT_PROCESSING'::"FeatureType"
            WHEN UPPER("feature") LIKE '%ADMIN%' THEN 'ADMIN_DASHBOARD'::"FeatureType"
            ELSE 'KEYWORD_ANALYSIS'::"FeatureType"
          END;
        
        ALTER TABLE "FeatureUsage" DROP COLUMN "feature";
        ALTER TABLE "FeatureUsage" RENAME COLUMN "feature_new" TO "feature";
        ALTER TABLE "FeatureUsage" ALTER COLUMN "feature" SET NOT NULL;
    END IF;
END $$;

-- Handle FeatureUsageLog table enum conversion and add userId
DO $$ 
BEGIN
    -- Add userId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FeatureUsageLog' 
        AND column_name = 'userId'
    ) THEN
        ALTER TABLE "FeatureUsageLog" ADD COLUMN "userId" TEXT;
    END IF;

    -- Check if the feature column is already an enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FeatureUsageLog' 
        AND column_name = 'feature' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Column is already an enum, do nothing
        NULL;
    ELSE
        -- Convert string column to enum
        ALTER TABLE "FeatureUsageLog" ADD COLUMN "feature_new" "FeatureType";
        
        UPDATE "FeatureUsageLog" SET "feature_new" = 
          CASE 
            WHEN UPPER("feature") LIKE '%KEYWORD%' THEN 'KEYWORD_ANALYSIS'::"FeatureType"
            WHEN UPPER("feature") LIKE '%SENTIMENT%' THEN 'SENTIMENT_ANALYSIS'::"FeatureType"
            WHEN UPPER("feature") LIKE '%TITLE%' THEN 'TITLE_GENERATION'::"FeatureType"
            WHEN UPPER("feature") LIKE '%EVALUATION%' THEN 'EVALUATION_METRIC'::"FeatureType"
            WHEN UPPER("feature") LIKE '%AUTH%' THEN 'USER_AUTHENTICATION'::"FeatureType"
            WHEN UPPER("feature") LIKE '%PAYMENT%' THEN 'PAYMENT_PROCESSING'::"FeatureType"
            WHEN UPPER("feature") LIKE '%ADMIN%' THEN 'ADMIN_DASHBOARD'::"FeatureType"
            ELSE 'KEYWORD_ANALYSIS'::"FeatureType"
          END;
        
        ALTER TABLE "FeatureUsageLog" DROP COLUMN "feature";
        ALTER TABLE "FeatureUsageLog" RENAME COLUMN "feature_new" TO "feature";
        ALTER TABLE "FeatureUsageLog" ALTER COLUMN "feature" SET NOT NULL;
    END IF;
END $$;

-- Add foreign key constraint for FeatureUsageLog.userId if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "FeatureUsageLog" ADD CONSTRAINT "FeatureUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "FeatureUsageLog_usedAt_idx" ON "FeatureUsageLog"("usedAt");
CREATE INDEX IF NOT EXISTS "FeatureUsageLog_feature_idx" ON "FeatureUsageLog"("feature");
CREATE INDEX IF NOT EXISTS "FeatureUsageLog_userId_idx" ON "FeatureUsageLog"("userId");
CREATE INDEX IF NOT EXISTS "SystemMetrics_timestamp_idx" ON "SystemMetrics"("timestamp");
CREATE INDEX IF NOT EXISTS "SystemMetrics_feature_idx" ON "SystemMetrics"("feature");
CREATE INDEX IF NOT EXISTS "PopularContent_contentType_idx" ON "PopularContent"("contentType");
CREATE INDEX IF NOT EXISTS "PopularContent_usageCount_idx" ON "PopularContent"("usageCount");