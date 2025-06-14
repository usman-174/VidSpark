import { Request, Response, NextFunction } from "express";
import { PrismaClient, PolicyType } from "@prisma/client";

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
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('day', "createdAt") as date,
            COUNT(*)::integer as count
          FROM "KeywordAnalysis"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY date
          ORDER BY date ASC
        `,
        // Get title generation stats for the last 30 days
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
        date: item.date.toISOString().split('T')[0],
        count: item.count,
      }));

      // Process title generation data for chart
      const titleGenerationData = (titleGenerationStats as any[]).map((item) => ({
        date: item.date.toISOString().split('T')[0],
        count: item.count,
      }));

      // Get top 5 most used keywords
      const popularKeywords = await prisma.$queryRaw`
        SELECT 
          UNNEST(keywords) as keyword,
          COUNT(*)::integer as usage_count
        FROM "KeywordAnalysis"
        GROUP BY keyword
        ORDER BY usage_count DESC
        LIMIT 5
      `;

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
          popularKeywords: (popularKeywords as any[]).map(k => ({
            keyword: k.keyword,
            count: k.usage_count
          })),
          averageTitlesPerUser: totalUsers 
            ? Number((totalTitleGenerations / totalUsers).toFixed(2)) 
            : 0,
          averageKeywordsPerUser: totalUsers 
            ? Number((totalKeywordAnalyses / totalUsers).toFixed(2)) 
            : 0,
        }
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
    const days = Math.min(parseInt(req.query.days as string || "30", 10), 90);

    const stats = await withCache(`user_growth_${days}`, async () => {
      // Modified query to handle date types correctly
      const userGrowth = await prisma.$queryRaw<{ date: string; count: number }[]>`
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
          OR: [
            { children: { some: {} } },
            { parent: { isNot: null } },
          ],
        },
      });

      return {
        dailyGrowth: userGrowth.map(entry => ({
          date: entry.date,
          count: entry.count
        })),
        trends: {
          total: userGrowth.reduce((sum, day) => sum + day.count, 0),
          averageDaily: Number((userGrowth.reduce((sum, day) => sum + day.count, 0) / days).toFixed(2)),
          usersInFamilyStructure: familyStats._count.id,
        },
      };
    });

    res.status(200).json(stats);
  } catch (error:any) {
    console.error('User growth query error:', error);
    res.status(500).json({ 
      message: "Error fetching user growth stats", 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getUserDomainStats = async (req: Request, res: Response) => {
  try {
    const stats = await withCache("domain_stats", async () => {
      // Simplified query to just get domain counts
      const domainStats = await prisma.$queryRaw<{ domain: string; count: number }[]>`
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
      const usersInTopDomains = domainStats.reduce((sum, domain) => sum + domain.count, 0);

      return {
        domains: domainStats.map(d => ({
          domain: d.domain,
          count: d.count,
          percentage: Number(((d.count / totalUsers) * 100).toFixed(1))
        })),
        stats: {
          totalDomains,
          topDomainsUsers: usersInTopDomains,
          otherUsersCount: totalUsers - usersInTopDomains
        }
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    handleError(error, res, "Error fetching user domain stats");
  }
};
export const getFeatureUsageStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Fetch counts from the featureUsage table for the two features
    const usageRows = await prisma.featureUsage.findMany({
      where: {
        feature: {
          in: ["keyword_analysis", "title_generation"],
        },
      },
      orderBy: { feature: "asc" },
    });

    // Transform into a simple object
    const result: Record<string, number> = {};
    for (const row of usageRows) {
      result[row.feature] = row.count;
    }

    // Ensure both keys exist, default to 0 if missing
    if (!result["keyword_analysis"]) {
      result["keyword_analysis"] = 0;
    }
    if (!result["title_generation"]) {
      result["title_generation"] = 0;
    }

    // **Note: do not return res.json(...)** — just call it
    res.status(200).json({ success: true, usage: result });
  } catch (error) {
    console.error("❌ Error fetching feature usage stats:", error);
    // Call next(error) or send a response without “return”
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature usage stats",
    });
  }
};