// Updated adminController.ts with enhanced stats integration
import { Request, Response, NextFunction } from "express";
import {
  PrismaClient,
  PolicyType,
  FeatureType,
  ContentType,
} from "@prisma/client";
import {
  getDailyInsights,
  getUserEngagementStats,
  getSystemPerformanceMetrics,
  getPopularContent,
  generateInsightsSummary,
  getFeatureUsageCountByRange,
} from "../services/statsService";

const prisma = new PrismaClient();

// Simple in-memory cache implementation
class SimpleCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }
}

const cache = new SimpleCache();

// Error handler utility
const handleError = (error: any, res: Response, message: string) => {
  console.error(`${message}:`, error);
  const statusCode = error.code === "P2002" ? 400 : 500;
  res.status(statusCode).json({
    message,
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
};

// Cache middleware
const withCache = async (key: string, getData: () => Promise<any>) => {
  const cachedData = cache.get(key);
  if (cachedData) return cachedData;

  const data = await getData();
  cache.set(key, data);
  return data;
};

// ================================
// 📊 ENHANCED FEATURE USAGE STATS
// ================================

export const getFeatureUsageStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = "30d", detailed = "false" } = req.query;

    const stats = await withCache(
      `feature_usage_${period}_${detailed}`,
      async () => {
        // Get basic feature usage stats with updated enum values
        const usageRows = await prisma.featureUsage.findMany({
          where: {
            feature: {
              in: [
                FeatureType.KEYWORD_ANALYSIS,
                FeatureType.TITLE_GENERATION,
                FeatureType.SENTIMENT_ANALYSIS,
                FeatureType.EVALUATION_METRIC,
              ],
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        const result: Record<string, number> = {};

        // Map enum values to readable names and get counts
        for (const row of usageRows) {
          const featureName = row.feature.toLowerCase();
          result[featureName] = row.totalCount;
        }

        // Ensure all features are present, default to 0 if not found
        const allFeatures = [
          "keyword_analysis",
          "title_generation",
          "sentiment_analysis",
          "evaluation_metric",
        ];

        for (const feature of allFeatures) {
          if (!(feature in result)) {
            result[feature] = 0;
          }
        }

        // Basic response
        const basicData = {
          usage: result,
          total_usage: Object.values(result).reduce(
            (sum, count) => sum + count,
            0
          ),
          period: period,
          most_popular_feature: Object.entries(result).reduce((a, b) =>
            result[a[0]] > result[b[0]] ? a : b
          )[0],
        };

        // If detailed stats requested, include additional insights
        if (detailed === "true") {
          // Get time-based usage data
          const days = parseInt(period.toString().replace("d", "")) || 30;
          const timeBasedUsage = await getFeatureUsageCountByRange(
            `${days} days`
          );

          // Get daily insights for the specified period
          const dailyInsights = await getDailyInsights(days);

          // Get user engagement stats
          const userStats = await getUserEngagementStats();

          // Get system performance metrics
          const performanceStats = await getSystemPerformanceMetrics(24); // Last 24 hours

          // Get popular content
          const popularTitles = await getPopularContent(ContentType.TITLE, 10);
          const popularTags = await getPopularContent(ContentType.TAG, 10);
          const popularKeywords = await getPopularContent(
            ContentType.KEYWORD,
            10
          );

          // Calculate trends and additional metrics
          const trends = calculateFeatureTrends(dailyInsights);
          const peakUsageInsights = calculatePeakUsageInsights(dailyInsights);

          return {
            ...basicData,
            detailed_stats: {
              time_based_usage: timeBasedUsage,
              daily_insights: dailyInsights.slice(0, 7), // Last 7 days
              user_engagement: userStats,
              system_performance: {
                avg_response_time: performanceStats.avgResponseTime,
                error_rate: performanceStats.errorRate,
                success_rate: performanceStats.successRate,
                total_requests: performanceStats.totalRequests,
              },
              popular_content: {
                titles: popularTitles.slice(0, 5),
                tags: popularTags.slice(0, 10),
                keywords: popularKeywords.slice(0, 10),
              },
              trends,
              peak_usage_insights: peakUsageInsights,
              feature_performance: await getFeaturePerformanceMetrics(),
              summary: {
                total_features_used: Object.values(result).reduce(
                  (sum, count) => sum + count,
                  0
                ),
                active_users_last_30d: userStats.activeUsers,
                user_engagement_rate: userStats.engagementRate,
                avg_processing_time: performanceStats.avgResponseTime,
                system_health:
                  performanceStats.successRate > 95
                    ? "Excellent"
                    : performanceStats.successRate > 85
                    ? "Good"
                    : "Needs Attention",
              },
            },
          };
        }

        return basicData;
      }
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: "Feature usage statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching feature usage stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature usage stats",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getFeatureUsageByRange = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = "7d" } = req.query;
    console.log("🔔 API HIT: /feature-usage-by-range");
    console.log("🔍 Range received:", range);

    const validRanges: Record<string, string> = {
      "1h": "1 hour",
      "24h": "1 day",
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
    };

    const interval = validRanges[range as string];
    if (!interval) {
      res.status(400).json({
        success: false,
        message: "Invalid range. Valid options are: 1h, 24h, 7d, 30d, 90d",
      });
      return;
    }

    const cacheKey = `feature_usage_range_${range}`;
    const stats = await withCache(cacheKey, async () => {
      const result = await getFeatureUsageCountByRange(interval);

      // Get additional insights for the range
      const days = parseInt(range.toString().replace(/[hd]/g, "")) || 7;
      const dailyInsights = await getDailyInsights(days);

      // Calculate growth rate
      const growthRate = calculateGrowthRate(dailyInsights);

      return {
        usage: result,
        range: range,
        interval: interval,
        topFeature: result.length > 0 ? result[0].feature : null,
        growth_rate: growthRate,
        insights: {
          total_requests: result.reduce((sum, item) => sum + item.count, 0),
          avg_daily_usage:
            dailyInsights.length > 0
              ? Math.round(
                  result.reduce((sum, item) => sum + item.count, 0) /
                    dailyInsights.length
                )
              : 0,
          peak_day: findPeakDay(dailyInsights),
          feature_distribution: calculateFeatureDistribution(result),
        },
      };
    });

    res.status(200).json({
      success: true,
      data: stats,
      message: `Feature usage for ${range} retrieved successfully`,
    });
  } catch (error) {
    console.error("❌ Error fetching feature usage by range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature usage by range",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ================================
// 📊 NEW COMPREHENSIVE INSIGHTS ENDPOINT
// ================================

export const getComprehensiveInsights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const dayCount = Math.min(parseInt(days as string), 90);

    const insights = await withCache(
      `comprehensive_insights_${dayCount}`,
      async () => {
        return await generateInsightsSummary();
      }
    );

    res.status(200).json({
      success: true,
      data: insights,
      message: "Comprehensive insights retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching comprehensive insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comprehensive insights",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ================================
// 📊 USER ENGAGEMENT INSIGHTS
// ================================

export const getUserEngagementInsights = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const insights = await withCache("user_engagement_insights", async () => {
      const userStats = await getUserEngagementStats();

      // Get top engaged users
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
              createdAt: true,
            },
          },
        },
      });

      const totalUsers = await prisma.user.count();

      // Feature adoption from userEngagement
      const featureAdoption = await prisma.userEngagement.groupBy({
        by: ["favoriteFeature"],
        _count: {
          favoriteFeature: true,
        },
        where: {
          favoriteFeature: {
            not: null,
          },
        },
      });

      // Count how many unique users used keyword_analysis (non-null userId)
      const keywordAnalysisUsers = await prisma.keywordAnalysis.findMany({
        where: {
          userId: {
            not: null,
          },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      });

      const keywordAnalysisCount = keywordAnalysisUsers.length;

      return {
        overview: userStats,
        top_engaged_users: topUsers.map((engagement) => ({
          user: engagement.user,
          stats: {
            total_sessions: engagement.totalSessions,
            favorite_feature: engagement.favoriteFeature,
            keyword_analysis_count: engagement.keywordAnalysisCount,
            title_generation_count: engagement.titleGenerationCount,
            sentiment_analysis_count: engagement.sentimentAnalysisCount,
            evaluation_metric_count: engagement.evaluationMetricCount,
            last_active: engagement.lastUsedAt,
          },
        })),
        feature_adoption: [
          ...featureAdoption.map((item) => ({
            feature: item.favoriteFeature,
            user_count: item._count.favoriteFeature,
            adoption_rate:
              totalUsers > 0
                ? (item._count.favoriteFeature / totalUsers) * 100
                : 0,
          })),
          {
            feature: "keyword_analysis",
            user_count: keywordAnalysisCount,
            adoption_rate:
              totalUsers > 0 ? (keywordAnalysisCount / totalUsers) * 100 : 0,
          },
        ],
      };
    });

    res.status(200).json({
      success: true,
      data: insights,
      message: "User engagement insights retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching user engagement insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user engagement insights",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ================================
// 📊 HELPER FUNCTIONS
// ================================

// Helper function to calculate feature trends
function calculateFeatureTrends(dailyInsights: any[]) {
  if (dailyInsights.length < 2) return {};

  const latest = dailyInsights[0];
  const previous = dailyInsights[1];

  if (!latest || !previous) return {};

  return {
    keyword_analysis: {
      change: latest.keywordAnalysisCount - previous.keywordAnalysisCount,
      percentage:
        previous.keywordAnalysisCount > 0
          ? ((latest.keywordAnalysisCount - previous.keywordAnalysisCount) /
              previous.keywordAnalysisCount) *
            100
          : 0,
    },
    title_generation: {
      change: latest.titleGenerationCount - previous.titleGenerationCount,
      percentage:
        previous.titleGenerationCount > 0
          ? ((latest.titleGenerationCount - previous.titleGenerationCount) /
              previous.titleGenerationCount) *
            100
          : 0,
    },
    sentiment_analysis: {
      change: latest.sentimentAnalysisCount - previous.sentimentAnalysisCount,
      percentage:
        previous.sentimentAnalysisCount > 0
          ? ((latest.sentimentAnalysisCount - previous.sentimentAnalysisCount) /
              previous.sentimentAnalysisCount) *
            100
          : 0,
    },
    evaluation_metric: {
      change: latest.evaluationMetricCount - previous.evaluationMetricCount,
      percentage:
        previous.evaluationMetricCount > 0
          ? ((latest.evaluationMetricCount - previous.evaluationMetricCount) /
              previous.evaluationMetricCount) *
            100
          : 0,
    },
  };
}

// Helper function to calculate peak usage insights
function calculatePeakUsageInsights(dailyInsights: any[]) {
  if (dailyInsights.length === 0) return {};

  const totalUsage = dailyInsights.reduce((sum, day) => {
    return (
      sum +
      day.keywordAnalysisCount +
      day.titleGenerationCount +
      day.sentimentAnalysisCount +
      day.evaluationMetricCount
    );
  }, 0);

  const avgDailyUsage = totalUsage / dailyInsights.length;

  const peakDay = dailyInsights.reduce((peak, day) => {
    const dayTotal =
      day.keywordAnalysisCount +
      day.titleGenerationCount +
      day.sentimentAnalysisCount +
      day.evaluationMetricCount;
    const peakTotal =
      peak.keywordAnalysisCount +
      peak.titleGenerationCount +
      peak.sentimentAnalysisCount +
      peak.evaluationMetricCount;
    return dayTotal > peakTotal ? day : peak;
  }, dailyInsights[0]);

  return {
    avg_daily_usage: Math.round(avgDailyUsage),
    peak_day: {
      date: peakDay.date,
      total_usage:
        peakDay.keywordAnalysisCount +
        peakDay.titleGenerationCount +
        peakDay.sentimentAnalysisCount +
        peakDay.evaluationMetricCount,
    },
    usage_variance: calculateUsageVariance(dailyInsights),
  };
}

function calculateUsageVariance(dailyInsights: any[]) {
  const dailyTotals = dailyInsights.map(
    (day) =>
      day.keywordAnalysisCount +
      day.titleGenerationCount +
      day.sentimentAnalysisCount +
      day.evaluationMetricCount
  );

  const mean =
    dailyTotals.reduce((sum, total) => sum + total, 0) / dailyTotals.length;
  const variance =
    dailyTotals.reduce((sum, total) => sum + Math.pow(total - mean, 2), 0) /
    dailyTotals.length;

  return Math.sqrt(variance); // Standard deviation
}

function calculateGrowthRate(dailyInsights: any[]) {
  if (dailyInsights.length < 2) return 0;

  const recent = dailyInsights.slice(0, Math.ceil(dailyInsights.length / 2));
  const older = dailyInsights.slice(Math.ceil(dailyInsights.length / 2));

  const recentAvg =
    recent.reduce(
      (sum, day) =>
        sum +
        day.keywordAnalysisCount +
        day.titleGenerationCount +
        day.sentimentAnalysisCount +
        day.evaluationMetricCount,
      0
    ) / recent.length;

  const olderAvg =
    older.reduce(
      (sum, day) =>
        sum +
        day.keywordAnalysisCount +
        day.titleGenerationCount +
        day.sentimentAnalysisCount +
        day.evaluationMetricCount,
      0
    ) / older.length;

  return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
}

function findPeakDay(dailyInsights: any[]) {
  if (dailyInsights.length === 0) return null;

  return dailyInsights.reduce((peak, day) => {
    const dayTotal =
      day.keywordAnalysisCount +
      day.titleGenerationCount +
      day.sentimentAnalysisCount +
      day.evaluationMetricCount;
    const peakTotal =
      peak.keywordAnalysisCount +
      peak.titleGenerationCount +
      peak.sentimentAnalysisCount +
      peak.evaluationMetricCount;
    return dayTotal > peakTotal ? day : peak;
  }, dailyInsights[0]);
}

function calculateFeatureDistribution(usageData: any[]) {
  const total = usageData.reduce((sum, item) => sum + item.count, 0);

  return usageData.map((item) => ({
    feature: item.feature,
    count: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));
}

async function getFeaturePerformanceMetrics() {
  // Get average processing times by feature
  const performanceMetrics = await prisma.systemMetrics.groupBy({
    by: ["feature"],
    _avg: {
      avgResponseTime: true,
      successRate: true,
    },
    _count: {
      feature: true,
    },
    where: {
      feature: {
        not: null,
      },
    },
  });

  return performanceMetrics.map((metric) => ({
    feature: metric.feature,
    avg_response_time: metric._avg.avgResponseTime,
    avg_success_rate: metric._avg.successRate,
    total_requests: metric._count.feature,
  }));
}

// Keep existing functions unchanged
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const stats = await withCache("admin_stats", async () => {
      const [
        totalUsers,
        activeAdminUsers,
        newUsersToday,
        usersWithChildren,
        totalKeywordAnalyses,
        totalTitleGenerations,
        keywordUsageStats,
        titleGenerationStats,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            role: "ADMIN",
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.user.count({
          where: {
            children: {
              some: {},
            },
          },
        }),
        prisma.keywordAnalysis.count(),
        prisma.titleGeneration.count(),
        // Get keyword usage stats for the last 30 days
        // Corrected KeywordAnalysis query
        prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('day', "firstAnalyzed") as date,
    COUNT(*)::integer as count
  FROM "keyword_analysis"
  WHERE "firstAnalyzed" >= NOW() - INTERVAL '30 days'
  GROUP BY date
  ORDER BY date ASC
`,
        // Corrected TitleGeneration query (assuming same case issue)
        prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('day', "createdAt") as date,
    COUNT(*)::integer as count
  FROM "TitleGeneration"
  WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  GROUP BY date
  ORDER BY date ASC
`,
      ]);

      const userGrowthRate = totalUsers
        ? (newUsersToday / totalUsers) * 100
        : 0;

      // Process keyword usage data for chart
      const keywordUsageData = (keywordUsageStats as any[]).map((item) => ({
        date: item.date.toISOString().split("T")[0],
        count: item.count,
      }));

      // Process title generation data for chart
      const titleGenerationData = (titleGenerationStats as any[]).map(
        (item) => ({
          date: item.date.toISOString().split("T")[0],
          count: item.count,
        })
      );

      // Get top 5 most used keywords
      const popularKeywords = await prisma.$queryRawUnsafe(`
  SELECT 
    keyword,
    COUNT(*)::integer as usage_count
  FROM "keyword_analysis"
  GROUP BY keyword
  ORDER BY usage_count DESC
  LIMIT 5
`);

      return {
        totalUsers,
        activeAdminUsers,
        newUsersToday,
        usersWithChildren,
        userGrowthRate: Number(userGrowthRate.toFixed(2)),
        contentGenerationStats: {
          totalKeywordAnalyses,
          totalTitleGenerations,
          keywordUsageTrend: keywordUsageData,
          titleGenerationTrend: titleGenerationData,
          popularKeywords: (popularKeywords as any[]).map((k) => ({
            keyword: k.keyword,
            count: k.usage_count,
          })),
          averageTitlesPerUser: totalUsers
            ? Number((totalTitleGenerations / totalUsers).toFixed(2))
            : 0,
          averageKeywordsPerUser: totalUsers
            ? Number((totalKeywordAnalyses / totalUsers).toFixed(2))
            : 0,
        },
      };
    });

    res.status(200).json(stats);
  } catch (error: any) {
    handleError(error, res, error.message || "Error fetching admin stats");
  }
};

export const getInvitationStats = async (req: Request, res: Response) => {
  try {
    const stats = await withCache("invitation_stats", async () => {
      const [totalInvitations, usedInvitations] = await Promise.all([
        prisma.invitation.count(),
        prisma.invitation.count({
          where: { isUsed: true },
        }),
      ]);

      // Get top inviters
      const topInviters = await prisma.user.findMany({
        where: {
          sentInvitations: {
            some: {},
          },
        },
        select: {
          id: true,
          email: true,
          _count: {
            select: {
              sentInvitations: true,
            },
          },
        },
        orderBy: {
          sentInvitations: {
            _count: "desc",
          },
        },
        take: 5,
      });

      return {
        totalInvitations,
        usedInvitations,
        pendingInvitations: totalInvitations - usedInvitations,
        conversionRate: totalInvitations
          ? Number(((usedInvitations / totalInvitations) * 100).toFixed(2))
          : 0,
        topInviters: topInviters.map((user) => ({
          email: user.email,
          invitationsSent: user._count.sentInvitations,
        })),
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    handleError(error, res, "Error fetching invitation stats");
  }
};

export const getCreditStats = async (req: Request, res: Response) => {
  try {
    const stats = await withCache("credit_stats", async () => {
      const [totalCredits, creditsByPolicy, policiesStats] = await Promise.all([
        prisma.credit.aggregate({
          _sum: {
            credits: true,
          },
        }),
        prisma.policy.findMany({
          select: {
            type: true,
            credits: true,
          },
        }),
        // Get count of users for each policy type based on their credits
        Promise.all(
          Object.values(PolicyType).map(async (type) => {
            const policy = await prisma.policy.findFirst({
              where: { type },
              select: { credits: true },
            });

            if (!policy) return { type, userCount: 0 };

            const userCount = await prisma.user.count({
              where: {
                credits: {
                  some: {
                    credits: policy.credits,
                  },
                },
              },
            });

            return {
              type,
              userCount,
            };
          })
        ),
      ]);

      return {
        totalCreditsGiven: totalCredits._sum.credits || 0,
        creditsByPolicyType: creditsByPolicy,
        policyStats: policiesStats.map((stat) => ({
          type: stat.type,
          userCount: stat.userCount,
        })),
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    handleError(error, res, "Error fetching credit stats");
  }
};

export const getUserGrowthStats = async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt((req.query.days as string) || "30", 10), 90);

    const stats = await withCache(`user_growth_${days}`, async () => {
      // Modified query to handle date types correctly
      const userGrowth = await prisma.$queryRaw<
        { date: string; count: number }[]
      >`
        WITH RECURSIVE dates AS (
          SELECT CAST(CURRENT_DATE - (${days} || ' days')::INTERVAL AS DATE) as date
          UNION ALL
          SELECT CAST(date + '1 day'::INTERVAL AS DATE) AS date
          FROM dates
          WHERE date < CURRENT_DATE
        )
        SELECT 
          TO_CHAR(d.date, 'YYYY-MM-DD') as date,
          COALESCE(CAST(COUNT(u.id) AS INTEGER), 0) as count
        FROM dates d
        LEFT JOIN "User" u ON DATE(u."createdAt") = d.date
        GROUP BY d.date
        ORDER BY d.date ASC;
      `;

      // Get family stats
      const familyStats = await prisma.user.aggregate({
        _count: {
          id: true,
        },
        where: {
          OR: [{ children: { some: {} } }, { parent: { isNot: null } }],
        },
      });

      return {
        dailyGrowth: userGrowth.map((entry) => ({
          date: entry.date,
          count: entry.count,
        })),
        trends: {
          total: userGrowth.reduce((sum, day) => sum + day.count, 0),
          averageDaily: Number(
            (
              userGrowth.reduce((sum, day) => sum + day.count, 0) / days
            ).toFixed(2)
          ),
          usersInFamilyStructure: familyStats._count.id,
        },
      };
    });

    res.status(200).json(stats);
  } catch (error: any) {
    console.error("User growth query error:", error);
    res.status(500).json({
      message: "Error fetching user growth stats",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

export const getUserDomainStats = async (req: Request, res: Response) => {
  try {
    const stats = await withCache("domain_stats", async () => {
      // Simplified query to just get domain counts
      const domainStats = await prisma.$queryRaw<
        { domain: string; count: number }[]
      >`
        SELECT 
          SPLIT_PART(email, '@', 2) AS domain,
          CAST(COUNT(*) AS INTEGER) as count
        FROM "User"
        GROUP BY SPLIT_PART(email, '@', 2)
        ORDER BY count DESC
        LIMIT 10;
      `;

      const totalUsers = await prisma.user.count();
      const totalDomains = domainStats.length;
      const usersInTopDomains = domainStats.reduce(
        (sum, domain) => sum + domain.count,
        0
      );

      return {
        domains: domainStats.map((d) => ({
          domain: d.domain,
          count: d.count,
          percentage: Number(((d.count / totalUsers) * 100).toFixed(1)),
        })),
        stats: {
          totalDomains,
          topDomainsUsers: usersInTopDomains,
          otherUsersCount: totalUsers - usersInTopDomains,
        },
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    handleError(error, res, "Error fetching user domain stats");
  }
};
