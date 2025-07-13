// services/userInsightsService.ts
import { PrismaClient, FeatureType } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUserDashboardInsights(userId: string) {
  try {
    // Get user engagement data
    const userEngagement = await prisma.userEngagement.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true,
            creditBalance: true,
          },
        },
      },
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.featureUsageLog.findMany({
      where: {
        userId,
        usedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { usedAt: "desc" },
      take: 50,
    });

    // Get content creation stats
    const [
      titleGenerations,
      keywordAnalyses,
      sentimentAnalyses,
      evaluationMetrics,
    ] = await Promise.all([
      prisma.titleGeneration.count({ where: { userId } }),
      prisma.keywordAnalysis.count({ where: { userId } }),
      prisma.sentimentalAnalysis.count({ where: { userId } }),
      prisma.evaluationMetric.count({ where: { userId } }),
    ]);

    // Get favorite titles count
    const favoriteTitles = await prisma.generatedTitle.count({
      where: {
        generation: { userId },
        isFavorite: true,
      },
    });

    // Calculate feature usage breakdown
    const featureBreakdown = {
      keyword_analysis: userEngagement?.keywordAnalysisCount || 0,
      title_generation: userEngagement?.titleGenerationCount || 0,
      sentiment_analysis: userEngagement?.sentimentAnalysisCount || 0,
      evaluation_metric: userEngagement?.evaluationMetricCount || 0,
    };

    const totalUsage = Object.values(featureBreakdown).reduce(
      (sum, count) => sum + count,
      0
    );
    const mostUsedFeature = Object.entries(featureBreakdown).reduce((a, b) =>
      featureBreakdown[a[0] as keyof typeof featureBreakdown] >
      featureBreakdown[b[0] as keyof typeof featureBreakdown]
        ? a
        : b
    )[0];

    // Calculate activity streak
    const activityStreak = calculateActivityStreak(recentActivity);

    // Get recent performance trends
    const performanceTrends = await getPerformanceTrends(userId);

    return {
      user: userEngagement?.user,
      overview: {
        total_feature_usage: totalUsage,
        most_used_feature: mostUsedFeature,
        favorite_feature: userEngagement?.favoriteFeature,
        activity_streak: activityStreak,
        last_active: userEngagement?.lastUsedAt,
        member_since: userEngagement?.firstUsedAt,
        credit_balance: userEngagement?.user?.creditBalance || 0,
      },
      feature_breakdown: Object.entries(featureBreakdown).map(
        ([feature, count]) => ({
          feature,
          count,
          percentage:
            totalUsage > 0 ? Math.round((count / totalUsage) * 100) : 0,
        })
      ),
      content_stats: {
        titles_generated: titleGenerations,
        keywords_analyzed: keywordAnalyses,
        sentiment_analyses: sentimentAnalyses,
        favorite_titles: favoriteTitles,
        evaluation_metrics: evaluationMetrics,
      },
      recent_activity: {
        last_30_days: recentActivity.length,
        daily_average: Math.round(recentActivity.length / 30),
        peak_day: findPeakActivityDay(recentActivity),
      },
      performance_trends: performanceTrends,
    };
  } catch (error) {
    console.error("Error getting user dashboard insights:", error);
    throw error;
  }
}

export async function getUserContentPerformance(userId: string) {
  try {
    // Get user's title generations with evaluation metrics
    const titleGenerations = await prisma.titleGeneration.findMany({
      where: { userId },
      include: {
        titles: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get keyword analyses
    const keywordAnalyses = await prisma.keywordAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get recent sentiment analyses
    const sentimentAnalyses = await prisma.sentimentalAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate content performance metrics
    const totalTitles = titleGenerations.reduce(
      (sum, gen) => sum + gen.titles.length,
      0
    );
    const favoriteTitlesCount = titleGenerations.reduce(
      (sum, gen) => sum + gen.titles.filter((title) => title.isFavorite).length,
      0
    );

    return {
      title_performance: {
        total_titles: totalTitles,
        total_generations: titleGenerations.length,
        favorite_titles: favoriteTitlesCount,
        avg_titles_per_generation:
          titleGenerations.length > 0
            ? Math.round(totalTitles / titleGenerations.length)
            : 0,
        recent_generations: titleGenerations.slice(0, 5).map((gen) => ({
          id: gen.id,
          prompt: gen.prompt.substring(0, 100),
          titles_count: gen.titles.length,
          created_at: gen.createdAt,
          provider: gen.provider,
        })),
      },
      keyword_performance: {
        total_analyses: keywordAnalyses.length,
        recent_keywords: keywordAnalyses.slice(0, 10).map((analysis) => ({
          keywords: analysis.keywords,
          video_url: analysis.videoUrl,
          created_at: analysis.createdAt,
        })),
      },
      sentiment_performance: {
        total_analyses: sentimentAnalyses.length,
        avg_sentiment:
          sentimentAnalyses.length > 0
            ? {
                positive:
                  sentimentAnalyses.reduce((sum, s) => sum + s.positive, 0) /
                  sentimentAnalyses.length,
                negative:
                  sentimentAnalyses.reduce((sum, s) => sum + s.negative, 0) /
                  sentimentAnalyses.length,
                neutral:
                  sentimentAnalyses.reduce((sum, s) => sum + s.neutral, 0) /
                  sentimentAnalyses.length,
              }
            : null,
      },
    };
  } catch (error) {
    console.error("Error getting user content performance:", error);
    throw error;
  }
}

export async function getUserRecommendations(userId: string) {
  try {
    const userEngagement = await prisma.userEngagement.findUnique({
      where: { userId },
    });

    if (!userEngagement) {
      return {
        feature_suggestions: [
          "Try keyword analysis to discover trending topics",
        ],
        content_tips: ["Start by generating your first title"],
        optimization_tips: ["Use evaluation metrics to improve your content"],
      };
    }

    const recommendations = [];
    const contentTips = [];
    const optimizationTips = [];

    // Feature suggestions based on usage
    if (userEngagement.keywordAnalysisCount === 0) {
      recommendations.push("Discover trending keywords with Keyword Analysis");
    }
    if (userEngagement.sentimentAnalysisCount === 0) {
      recommendations.push(
        "Analyze audience sentiment with Sentiment Analysis"
      );
    }
    if (userEngagement.evaluationMetricCount === 0) {
      recommendations.push("Predict video performance with Evaluation Metrics");
    }
    if (userEngagement.titleGenerationCount < 5) {
      recommendations.push("Generate more titles to find the perfect ones");
    }

    // Content tips based on patterns
    if (
      userEngagement.titleGenerationCount > userEngagement.keywordAnalysisCount
    ) {
      contentTips.push(
        "Research keywords before generating titles for better results"
      );
    }
    if (
      userEngagement.keywordAnalysisCount > 0 &&
      userEngagement.evaluationMetricCount === 0
    ) {
      contentTips.push(
        "Use evaluation metrics to test your keywords and titles"
      );
    }

    // Optimization tips
    const totalUsage =
      userEngagement.keywordAnalysisCount +
      userEngagement.titleGenerationCount +
      userEngagement.sentimentAnalysisCount +
      userEngagement.evaluationMetricCount;

    if (totalUsage < 10) {
      optimizationTips.push(
        "Explore different features to maximize your content strategy"
      );
    }
    if (
      userEngagement.totalSessions > 0 &&
      totalUsage / userEngagement.totalSessions < 2
    ) {
      optimizationTips.push(
        "Try using multiple features per session for better results"
      );
    }

    return {
      feature_suggestions:
        recommendations.length > 0
          ? recommendations
          : ["You're using all features! Keep experimenting."],
      content_tips:
        contentTips.length > 0
          ? contentTips
          : ["Your content workflow looks optimized!"],
      optimization_tips:
        optimizationTips.length > 0
          ? optimizationTips
          : ["Great job utilizing the platform efficiently!"],
    };
  } catch (error) {
    console.error("Error getting user recommendations:", error);
    throw error;
  }
}

export async function getUserActivitySummary(userId: string, days: number = 7) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await prisma.featureUsageLog.findMany({
      where: {
        userId,
        usedAt: { gte: startDate },
      },
      orderBy: { usedAt: "desc" },
    });

    // Group by date
    const dailyActivity = activities.reduce((acc, activity) => {
      const date = activity.usedAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, by_feature: {} };
      }
      acc[date].total += 1;
      acc[date].by_feature[activity.feature] =
        (acc[date].by_feature[activity.feature] || 0) + 1;
      return acc;
    }, {} as Record<string, any>);

    // Calculate peak hours
    const hourlyActivity = activities.reduce((acc, activity) => {
      const hour = activity.usedAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourlyActivity).reduce((a, b) =>
      hourlyActivity[parseInt(a[0])] > hourlyActivity[parseInt(b[0])] ? a : b
    )[0];

    return {
      period: `${days} days`,
      total_activities: activities.length,
      daily_breakdown: Object.values(dailyActivity),
      peak_hour: peakHour ? `${peakHour}:00` : null,
      most_active_day: Object.values(dailyActivity).reduce(
        (a: any, b: any) => (a.total > b.total ? a : b),
        { total: 0 }
      ),
      feature_usage: activities.reduce((acc, activity) => {
        acc[activity.feature] = (acc[activity.feature] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error("Error getting user activity summary:", error);
    throw error;
  }
}

// Helper functions
function calculateActivityStreak(activities: any[]): number {
  if (activities.length === 0) return 0;

  activities.sort(
    (a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const activity of activities) {
    const activityDate = new Date(activity.usedAt);
    activityDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

function findPeakActivityDay(activities: any[]): string | null {
  if (activities.length === 0) return null;

  const dailyCounts = activities.reduce((acc, activity) => {
    const date = activity.usedAt.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(dailyCounts).reduce((a, b) =>
    dailyCounts[a[0]] > dailyCounts[b[0]] ? a : b
  )[0];
}

async function getPerformanceTrends(userId: string) {
  try {
    // Get last 7 days of activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = await prisma.featureUsageLog.findMany({
      where: {
        userId,
        usedAt: { gte: sevenDaysAgo },
      },
      orderBy: { usedAt: "desc" },
    });

    const thisWeek = recentLogs.length;

    // Get previous 7 days for comparison
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const previousLogs = await prisma.featureUsageLog.findMany({
      where: {
        userId,
        usedAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
    });

    const lastWeek = previousLogs.length;
    const weeklyChange =
      lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return {
      weekly_activity: thisWeek,
      previous_week: lastWeek,
      weekly_change_percent: Math.round(weeklyChange),
      trend:
        weeklyChange > 0
          ? "increasing"
          : weeklyChange < 0
          ? "decreasing"
          : "stable",
    };
  } catch (error) {
    console.error("Error calculating performance trends:", error);
    return null;
  }
}
