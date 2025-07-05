// controllers/userInsightsController.ts
import { Request, Response } from 'express';
import {
  getUserDashboardInsights,
  getUserContentPerformance,
  getUserRecommendations,
  getUserActivitySummary
} from '../services/userInsightsService';

export class UserInsightsController {

  /**
   * Get comprehensive dashboard insights for user homepage
   * GET /api/user/insights/dashboard
   */
  public static async getDashboardInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const insights = await getUserDashboardInsights(userId);

      res.status(200).json({
        success: true,
        data: insights,
        message: 'Dashboard insights retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user content performance metrics
   * GET /api/user/insights/performance
   */
  public static async getContentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const performance = await getUserContentPerformance(userId);

      res.status(200).json({
        success: true,
        data: performance,
        message: 'Content performance retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error fetching content performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get personalized recommendations for user
   * GET /api/user/insights/recommendations
   */
  public static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const recommendations = await getUserRecommendations(userId);

      res.status(200).json({
        success: true,
        data: recommendations,
        message: 'Recommendations retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user activity summary
   * GET /api/user/insights/activity?days=7
   */
  public static async getActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.user?.userId;
      const days = parseInt(req.query.days as string) || 7;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Validate days parameter
      if (days < 1 || days > 90) {
        res.status(400).json({
          success: false,
          message: 'Days parameter must be between 1 and 90'
        });
        return;
      }

      const activity = await getUserActivitySummary(userId, days);

      res.status(200).json({
        success: true,
        data: activity,
        message: `Activity summary for ${days} days retrieved successfully`
      });

    } catch (error) {
      console.error('❌ Error fetching activity summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get quick stats for user navbar/header
   * GET /api/user/insights/quick-stats
   */
  public static async getQuickStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Get minimal insights for quick display
      const insights = await getUserDashboardInsights(userId);

      const quickStats = {
        credit_balance: insights.user?.creditBalance || 0,
        total_usage: insights.overview.total_feature_usage,
        favorite_feature: insights.overview.favorite_feature,
        activity_streak: insights.overview.activity_streak,
        last_active: insights.overview.last_active
      };

      res.status(200).json({
        success: true,
        data: quickStats,
        message: 'Quick stats retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error fetching quick stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quick stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}