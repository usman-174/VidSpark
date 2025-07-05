// src/services/statsService.ts
import { PrismaClient, FeatureType, ContentType } from "@prisma/client";

const prisma = new PrismaClient();

// ================================
// 📊 FEATURE USAGE TRACKING
// ================================

interface FeatureUsageMetadata {
  userId?: string;
  processingTime?: number;
  itemCount?: number;
  success?: boolean;
  errorMessage?: string;
  videoUrl?: string;
  keywordCount?: number;
  titleCount?: number;
  [key: string]: any;
}

/**
 * Track feature usage with detailed metadata
 */
export async function trackFeatureUsage(
  feature: FeatureType,
  metadata?: FeatureUsageMetadata
): Promise<void> {
  try {
    const startTime = Date.now();

    // Increment total count - Fixed: removed createdAt from update
    await prisma.featureUsage.upsert({
      where: { feature },
      update: {
        totalCount: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        feature,
        totalCount: 1,
      },
    });

    // Insert detailed usage log
    await prisma.featureUsageLog.create({
      data: {
        feature,
        userId: metadata?.userId,
        metadata: metadata
          ? {
              ...metadata,
              trackingTime: Date.now() - startTime,
            }
          : null,
      },
    });

    // Update user engagement if userId provided
    if (metadata?.userId) {
      await updateUserEngagement(metadata.userId, feature, metadata);
    }

    // Update daily insights
    await updateDailyInsights(feature, metadata);

    // Track system metrics
    if (metadata?.processingTime) {
      await trackSystemMetrics(
        feature,
        metadata.processingTime,
        metadata.success !== false
      );
    }

    console.log(`✅ Feature usage tracked: ${feature}`);
  } catch (error) {
    console.error(`❌ Failed to track feature usage for "${feature}"`, error);
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function incrementFeatureUsage(feature: string): Promise<void> {
  const featureType = feature
    .toUpperCase()
    .replace(/[^A-Z_]/g, "_") as FeatureType;
  await trackFeatureUsage(featureType);
}

// ================================
// 📊 USER ENGAGEMENT TRACKING
// ================================

async function updateUserEngagement(
  userId: string,
  feature: FeatureType,
  metadata?: FeatureUsageMetadata
): Promise<void> {
  try {
    const now = new Date();

    // Get the correct field name for the feature count
    const getFeatureCountField = (feature: FeatureType): string => {
      switch (feature) {
        case FeatureType.KEYWORD_ANALYSIS:
          return 'keywordAnalysisCount';
        case FeatureType.SENTIMENT_ANALYSIS:
          return 'sentimentAnalysisCount';
        case FeatureType.TITLE_GENERATION:
          return 'titleGenerationCount';
        case FeatureType.EVALUATION_METRIC:
          return 'evaluationMetricCount';
        default:
          return 'keywordAnalysisCount'; // fallback
      }
    };

    const featureCountField = getFeatureCountField(feature);

    await prisma.userEngagement.upsert({
      where: { userId },
      update: {
        [featureCountField]: { increment: 1 },
        lastUsedAt: now,
        totalSessions: { increment: 1 },
        updatedAt: now,
      },
      create: {
        userId,
        [featureCountField]: 1,
        firstUsedAt: now,
        lastUsedAt: now,
        totalSessions: 1,
        favoriteFeature: feature,
      },
    });

    // Update favorite feature based on usage
    await updateFavoriteFeature(userId);
  } catch (error) {
    console.error(
      `❌ Failed to update user engagement for user ${userId}`,
      error
    );
  }
}

async function updateFavoriteFeature(userId: string): Promise<void> {
  try {
    const engagement = await prisma.userEngagement.findUnique({
      where: { userId },
    });

    if (engagement) {
      const featureCounts = {
        KEYWORD_ANALYSIS: engagement.keywordAnalysisCount,
        SENTIMENT_ANALYSIS: engagement.sentimentAnalysisCount,
        TITLE_GENERATION: engagement.titleGenerationCount,
        EVALUATION_METRIC: engagement.evaluationMetricCount,
      };

      const favoriteFeature = Object.entries(featureCounts).reduce((a, b) =>
        featureCounts[a[0] as keyof typeof featureCounts] >
        featureCounts[b[0] as keyof typeof featureCounts]
          ? a
          : b
      )[0] as FeatureType;

      await prisma.userEngagement.update({
        where: { userId },
        data: { favoriteFeature },
      });
    }
  } catch (error) {
    console.error(
      `❌ Failed to update favorite feature for user ${userId}`,
      error
    );
  }
}

// ================================
// 📊 DAILY INSIGHTS TRACKING
// ================================

async function updateDailyInsights(
  feature: FeatureType,
  metadata?: FeatureUsageMetadata
): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Increment feature-specific count
    switch (feature) {
      case FeatureType.KEYWORD_ANALYSIS:
        updateData.keywordAnalysisCount = { increment: 1 };
        if (metadata?.keywordCount) {
          updateData.totalKeywordsAnalyzed = {
            increment: metadata.keywordCount,
          };
        }
        break;
      case FeatureType.SENTIMENT_ANALYSIS:
        updateData.sentimentAnalysisCount = { increment: 1 };
        updateData.totalVideosAnalyzed = { increment: 1 };
        break;
      case FeatureType.TITLE_GENERATION:
        updateData.titleGenerationCount = { increment: 1 };
        if (metadata?.titleCount) {
          updateData.totalTitlesGenerated = { increment: metadata.titleCount };
        }
        break;
      case FeatureType.EVALUATION_METRIC:
        updateData.evaluationMetricCount = { increment: 1 };
        updateData.totalVideosAnalyzed = { increment: 1 };
        break;
    }

    // Update active users count
    if (metadata?.userId) {
      const userActiveToday = await prisma.featureUsageLog.findFirst({
        where: {
          userId: metadata.userId,
          usedAt: {
            gte: today,
          },
        },
      });

      if (!userActiveToday) {
        updateData.activeUsers = { increment: 1 };
      }
    }

    await prisma.dailyInsights.upsert({
      where: { date: today },
      update: updateData,
      create: {
        date: today,
        ...Object.fromEntries(
          Object.entries(updateData).map(([key, value]) => [
            key,
            typeof value === "object" && (value as any).increment
              ? (value as any).increment
              : value,
          ])
        ),
        totalUsers: await prisma.user.count(),
      },
    });
  } catch (error) {
    console.error(`❌ Failed to update daily insights`, error);
  }
}

// ================================
// 📊 SYSTEM METRICS TRACKING
// ================================

async function trackSystemMetrics(
  feature: FeatureType,
  responseTime: number,
  success: boolean
): Promise<void> {
  try {
    await prisma.systemMetrics.create({
      data: {
        feature,
        avgResponseTime: responseTime,
        requestCount: 1,
        errorCount: success ? 0 : 1,
        successRate: success ? 100 : 0,
      },
    });
  } catch (error) {
    console.error(`❌ Failed to track system metrics`, error);
  }
}

// ================================
// 📊 POPULAR CONTENT TRACKING
// ================================

export async function trackPopularContent(
  contentType: ContentType,
  content: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.popularContent.upsert({
      where: {
        contentType_content: {
          contentType: contentType,
          content: content.toLowerCase().trim(),
        },
      },
      update: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        metadata,
        updatedAt: new Date(),
      },
      create: {
        contentType,
        content: content.toLowerCase().trim(),
        usageCount: 1,
        metadata,
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`❌ Failed to track popular content`, error);
  }
}

// ================================
// 📊 ANALYTICS QUERIES
// ================================

export const getFeatureUsageCountByRange = async (interval: string) => {
  console.log("🔍 Running feature usage query for interval:", interval);

  try {
    const result = await prisma.$queryRaw<{ feature: string; count: bigint }[]>`
      SELECT 
        feature,
        COUNT(*)::BIGINT as count
      FROM "FeatureUsageLog" 
      WHERE "usedAt" >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL ${interval}
      GROUP BY feature 
      ORDER BY count DESC
    `;

    return result.map((r) => ({
      feature: r.feature,
      count: Number(r.count),
    }));
  } catch (error) {
    console.error('❌ Error in getFeatureUsageCountByRange:', error);
    return [];
  }
};

export const getDailyInsights = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.dailyInsights.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });
  } catch (error) {
    console.error('❌ Error in getDailyInsights:', error);
    return [];
  }
};

export const getUserEngagementStats = async () => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.userEngagement.count({
      where: {
        lastUsedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const topUsers = await prisma.userEngagement.findMany({
      take: 10,
      orderBy: {
        totalSessions: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      totalUsers,
      activeUsers,
      engagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      topUsers,
    };
  } catch (error) {
    console.error('❌ Error in getUserEngagementStats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      engagementRate: 0,
      topUsers: [],
    };
  }
};

export const getSystemPerformanceMetrics = async (hours: number = 24) => {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await prisma.systemMetrics.findMany({
      where: {
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Calculate aggregated metrics
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const avgResponseTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length
        : 0;

    return {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      avgResponseTime,
      successRate:
        totalRequests > 0
          ? ((totalRequests - totalErrors) / totalRequests) * 100
          : 0,
      metrics,
    };
  } catch (error) {
    console.error('❌ Error in getSystemPerformanceMetrics:', error);
    return {
      totalRequests: 0,
      totalErrors: 0,
      errorRate: 0,
      avgResponseTime: 0,
      successRate: 0,
      metrics: [],
    };
  }
};

export const getPopularContent = async (
  contentType?: ContentType,
  limit: number = 10
) => {
  try {
    return await prisma.popularContent.findMany({
      where: contentType ? { contentType } : undefined,
      take: limit,
      orderBy: {
        usageCount: "desc",
      },
    });
  } catch (error) {
    console.error('❌ Error in getPopularContent:', error);
    return [];
  }
};

export const getFeatureUsageByUser = async (userId: string) => {
  try {
    const userEngagement = await prisma.userEngagement.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    const recentUsage = await prisma.featureUsageLog.findMany({
      where: { userId },
      take: 50,
      orderBy: { usedAt: "desc" },
    });

    return {
      engagement: userEngagement,
      recentUsage,
    };
  } catch (error) {
    console.error('❌ Error in getFeatureUsageByUser:', error);
    return {
      engagement: null,
      recentUsage: [],
    };
  }
};

// ================================
// 📊 UTILITY FUNCTIONS
// ================================

export const generateInsightsSummary = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInsights = await prisma.dailyInsights.findUnique({
      where: { date: today },
    });

    const totalFeatureUsage = await prisma.featureUsage.findMany();
    const userStats = await getUserEngagementStats();
    const performanceStats = await getSystemPerformanceMetrics();

    return {
      today: todayInsights,
      totalUsage: totalFeatureUsage,
      users: userStats,
      performance: performanceStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error in generateInsightsSummary:', error);
    return {
      today: null,
      totalUsage: [],
      users: {
        totalUsers: 0,
        activeUsers: 0,
        engagementRate: 0,
        topUsers: [],
      },
      performance: {
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        avgResponseTime: 0,
        successRate: 0,
        metrics: [],
      },
      timestamp: new Date().toISOString(),
    };
  }
};