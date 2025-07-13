// controllers/evaluationMetricController.ts
import { Request, Response } from "express";
import axios from "axios";
import {
  trackFeatureUsage,
  trackPopularContent,
  updateFavoriteFeature,
} from "../services/statsService";
import { ContentType, FeatureType, PrismaClient } from "@prisma/client";

interface PredictionRequest {
  title: string;
  description: string;
  tags_cleaned: string;
}

interface PredictionResponse {
  predicted_views: number;
  confidence: string;
  processed_at: string;
}
const prisma = new PrismaClient();

export class EvaluationMetricController {
  private static readonly PYTHON_API_BASE_URL =
    process.env.PYTHON_API_URL || "http://localhost:7000";
  private static readonly API_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;

  public static async predictViews(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let success = false;
    const { user } = res.locals;
    const userId = user?.userId;
    try {
      const { title, description, tags_cleaned }: PredictionRequest = req.body;

      // Validate required fields
      if (!title || !description || !tags_cleaned) {
        res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "title, description, and tags_cleaned are required",
        });
        return;
      }

      // Validate input lengths
      if (
        title.length > 1000 ||
        description.length > 5000 ||
        tags_cleaned.length > 500
      ) {
        res.status(400).json({
          success: false,
          error: "Input too long",
          message:
            "Title max 1000 chars, description max 5000 chars, tags max 500 chars",
        });
        return;
      }

      console.log(`🔮 Predicting views for: "${title.substring(0, 50)}..."`);

      // Call Python API
      const prediction = await EvaluationMetricController.callPythonAPI(
        "/predict",
        {
          title: title.trim(),
          description: description.trim(),
          tags_cleaned: tags_cleaned.trim(),
        }
      );

      if (prediction) {
        success = true;
        const processingTime = Date.now() - startTime;

        // Track feature usage with detailed metadata
        await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
          userId,
          processingTime,
          success: true,
          predictedViews: prediction.predicted_views,
          confidence: prediction.confidence,
          titleLength: title.length,
          descriptionLength: description.length,
          tagsCount: tags_cleaned.split(/\s+/).filter((tag) => tag.length > 0)
            .length,
        });

        // Track popular content
        await trackPopularContent(ContentType.TITLE, title, {
          predictedViews: prediction.predicted_views,
          confidence: prediction.confidence,
        });

        // Track tags as popular content
        const tags = tags_cleaned.split(/\s+/).filter((tag) => tag.length > 0);
        for (const tag of tags.slice(0, 5)) {
          // Track top 5 tags to avoid spam
          await trackPopularContent(ContentType.TAG, tag, {
            fromTitle: title.substring(0, 50),
          });
        }

        res.status(200).json({
          success: true,
          data: {
            predicted_views: prediction.predicted_views,
            confidence: prediction.confidence,
            processed_at: prediction.processed_at,
            formatted_views: EvaluationMetricController.formatViews(
              prediction.predicted_views
            ),
            prediction_range: EvaluationMetricController.getPredictionRange(
              prediction.predicted_views,
              prediction.confidence
            ),
          },
          message: "View prediction completed successfully",
        });
      } else {
        // Track failed prediction
        await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
          userId,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: "Unable to get prediction from ML service",
        });

        res.status(500).json({
          success: false,
          error: "Prediction failed",
          message: "Unable to get prediction from ML service",
        });
      }
    } catch (error) {
      // Track error

      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        userId,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      console.error("❌ Prediction error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  /**
   * Batch predictions for multiple videos
   * POST /api/evaluation/batch-predict
   */
  public static async batchPredict(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { videos }: { videos: PredictionRequest[] } = req.body;
      const { user } = res.locals;
      const userId = user?.userId;
      if (!Array.isArray(videos) || videos.length === 0) {
        res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "videos array is required and cannot be empty",
        });
        return;
      }

      if (videos.length > 50) {
        res.status(400).json({
          success: false,
          error: "Batch too large",
          message: "Maximum 50 videos per batch request",
        });
        return;
      }

      console.log(`📊 Processing batch prediction for ${videos.length} videos`);

      const predictions = [];
      const errors = [];
      let successfulPredictions = 0;

      // Process videos sequentially to avoid overwhelming the Python API
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];

        try {
          // Validate each video
          if (!video.title || !video.description || !video.tags_cleaned) {
            errors.push({
              index: i,
              error: "Missing required fields",
              video: { title: video.title?.substring(0, 50) + "..." },
            });
            continue;
          }

          const prediction = await EvaluationMetricController.callPythonAPI(
            "/predict",
            {
              title: video.title.trim(),
              description: video.description.trim(),
              tags_cleaned: video.tags_cleaned.trim(),
            }
          );

          if (prediction) {
            successfulPredictions++;

            predictions.push({
              index: i,
              input: {
                title:
                  video.title.substring(0, 50) +
                  (video.title.length > 50 ? "..." : ""),
                tags: video.tags_cleaned,
              },
              prediction: {
                predicted_views: prediction.predicted_views,
                confidence: prediction.confidence,
                formatted_views: EvaluationMetricController.formatViews(
                  prediction.predicted_views
                ),
              },
            });

            // Track popular content for successful predictions
            await trackPopularContent(ContentType.TITLE, video.title, {
              predictedViews: prediction.predicted_views,
              batchIndex: i,
            });
          } else {
            errors.push({
              index: i,
              error: "Prediction failed",
              video: { title: video.title?.substring(0, 50) + "..." },
            });
          }
        } catch (error) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : "Unknown error",
            video: { title: video.title?.substring(0, 50) + "..." },
          });
        }
      }

      const processingTime = Date.now() - startTime;

      // Track batch feature usage
      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        userId,
        processingTime,
        success: successfulPredictions > 0,
        batchSize: videos.length,
        successfulPredictions,
        failedPredictions: errors.length,
        isBatch: true,
      });

      res.status(200).json({
        success: true,
        data: {
          predictions,
          errors,
          summary: {
            total_requested: videos.length,
            successful_predictions: predictions.length,
            failed_predictions: errors.length,
          },
        },
        message: `Batch prediction completed: ${predictions.length} successful, ${errors.length} failed`,
      });
    } catch (error) {
      // Track batch error
      const { user } = res.locals;
      const userId = user?.userId;
      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        userId,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        isBatch: true,
      });

      console.error("❌ Batch prediction error:", error);
      res.status(500).json({
        success: false,
        error: "Batch prediction failed",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  public static async saveEvaluationMetric(
    userId: string,
    title: string,
    description: string,
    tags: string,
    predictedViews: number,
    contentScore: number,
    processingTime: number
  ) {
    try {
      const evaluationMetric = await prisma.evaluationMetric.create({
        data: {
          userId,
          title,
          description,
          tags,
          predictedViews,
          contentScore,

          processingTime,
        },
      });

      return evaluationMetric;
    } catch (error) {
      console.error("Error saving evaluation metric to database:", error);
      throw error;
    }
  }
  /**
   * Get evaluation metrics and insights for content
   * POST /api/evaluation/analyze
   */
  public static async analyzeContent(
    req: Request,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();

    const { user } = res.locals;
    const userId = user?.userId;
    try {
      const { title, description, tags_cleaned }: PredictionRequest = req.body;
      if (!title || !description || !tags_cleaned) {
        res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "title, description, and tags_cleaned are required",
        });
        return;
      }

      // Get prediction from Python API
      const prediction = await EvaluationMetricController.callPythonAPI(
        "/predict",
        {
          title: title.trim(),
          description: description.trim(),
          tags_cleaned: tags_cleaned.trim(),
        }
      );

      if (!prediction) {
        // Track failed analysis
        await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
          userId,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: "Could not get prediction from ML service",
          isAnalysis: true,
        });

        res.status(500).json({
          success: false,
          error: "Analysis failed",
          message: "Could not get prediction from ML service",
        });
        return;
      }

      // Generate content insights
      const insights = EvaluationMetricController.generateContentInsights(
        title,
        description,
        tags_cleaned,
        prediction.predicted_views
      );

      const processingTime = Date.now() - startTime;
      const contentScore =
        EvaluationMetricController.calculateContentScore(insights);
      await EvaluationMetricController.saveEvaluationMetric(
        userId,
        title,
        description,
        tags_cleaned,
        prediction.predicted_views,
        contentScore,

        processingTime
      );

      // Track successful analysis with detailed insights
      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        userId,
        processingTime,
        success: true,
        isAnalysis: true,
        predictedViews: prediction.predicted_views,
        contentScore,
        performanceCategory: insights.performance_metrics.performance_category,
        titleOptimal: insights.content_analysis.title.optimal_length,
        descriptionOptimal:
          insights.content_analysis.description.optimal_length,
        tagsOptimal: insights.content_analysis.tags.optimal_count,
      });

      // Track content for analysis patterns
      await trackPopularContent(ContentType.TITLE, title, {
        contentScore,
        performanceCategory: insights.performance_metrics.performance_category,
        isAnalysis: true,
      });

      // Track description patterns
      await trackPopularContent(
        ContentType.DESCRIPTION,
        description.substring(0, 200),
        {
          readabilityScore:
            insights.content_analysis.description.readability_score,
          isAnalysis: true,
        }
      );
      await updateFavoriteFeature(res.locals.user.userId);
      res.status(200).json({
        success: true,
        data: {
          prediction: {
            predicted_views: prediction.predicted_views,
            confidence: prediction.confidence,
            formatted_views: EvaluationMetricController.formatViews(
              prediction.predicted_views
            ),
          },
          insights,
          recommendations:
            EvaluationMetricController.generateRecommendations(insights),
          content_score: contentScore,
        },
        message: "Content analysis completed successfully",
      });
    } catch (error) {
      // Track analysis error
      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        userId,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        isAnalysis: true,
      });

      console.error("❌ Content analysis error:", error);
      res.status(500).json({
        success: false,
        error: "Analysis failed",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  /**
   * Health check for Python ML API
   * GET /api/evaluation/health
   */
  public static async getHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if Python API is accessible
      const healthCheck = await axios.get(
        `${EvaluationMetricController.PYTHON_API_BASE_URL}/health`,
        {
          timeout: 10000,
        }
      );

      const responseTime = Date.now() - startTime;

      // Track health check success
      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        processingTime: responseTime,
        success: true,
        isHealthCheck: true,
        pythonApiStatus: "healthy",
      });

      res.status(200).json({
        success: true,
        data: {
          python_api_status: "healthy",
          python_api_url: EvaluationMetricController.PYTHON_API_BASE_URL,
          response_time_ms: responseTime,
          python_api_response: healthCheck.data,
          timestamp: new Date().toISOString(),
        },
        message: "Evaluation metric service is healthy",
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error("❌ Health check failed:", error);

      let errorMessage = "Unknown error";
      let statusCode = 500;

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          errorMessage = "Python API is not running or not accessible";
          statusCode = 503;
        } else if (error.code === "ETIMEDOUT") {
          errorMessage = "Python API response timeout";
          statusCode = 504;
        } else {
          errorMessage = error.message;
        }
      }

      // Track health check failure
      await trackFeatureUsage(FeatureType.EVALUATION_METRIC, {
        processingTime: responseTime,
        success: false,
        isHealthCheck: true,
        errorMessage,
        pythonApiStatus: "unhealthy",
      });

      res.status(statusCode).json({
        success: false,
        error: "Health check failed",
        message: errorMessage,
        python_api_url: EvaluationMetricController.PYTHON_API_BASE_URL,
      });
    }
  }
  // Private utility methods
  private static async callPythonAPI(
    endpoint: string,
    data: any,
    retries = 0
  ): Promise<PredictionResponse | null> {
    try {
      const response = await axios.post(
        `${this.PYTHON_API_BASE_URL}${endpoint}`,
        data,
        {
          timeout: this.API_TIMEOUT,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      if (retries < this.MAX_RETRIES && axios.isAxiosError(error)) {
        if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
          console.log(
            `⏳ Retrying API call (attempt ${retries + 1}/${this.MAX_RETRIES})`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retries + 1))
          ); // Exponential backoff
          return this.callPythonAPI(endpoint, data, retries + 1);
        }
      }

      console.error("❌ Python API call failed:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          throw new Error(
            "Python ML API is not running. Please start the Python server."
          );
        } else if (error.code === "ETIMEDOUT") {
          throw new Error(
            "Python ML API timeout. The service might be overloaded."
          );
        } else if (error.response?.status === 500) {
          throw new Error(
            "Python ML API internal error. Check the Python server logs."
          );
        }
      }

      return null;
    }
  }

  private static formatViews(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toLocaleString();
    }
  }

  private static getPredictionRange(
    views: number,
    confidence: string
  ): { min: number; max: number } {
    const variance =
      confidence === "High" ? 0.2 : confidence === "Medium" ? 0.4 : 0.6;
    return {
      min: Math.round(views * (1 - variance)),
      max: Math.round(views * (1 + variance)),
    };
  }

  private static generateContentInsights(
    title: string,
    description: string,
    tags: string,
    predictedViews: number
  ) {
    const titleWords = title.toLowerCase().split(/\s+/).length;
    const descriptionWords = description.toLowerCase().split(/\s+/).length;
    const tagCount = tags
      .toLowerCase()
      .split(/\s+/)
      .filter((tag) => tag.length > 0).length;

    return {
      content_analysis: {
        title: {
          length: title.length,
          word_count: titleWords,
          optimal_length: titleWords >= 5 && titleWords <= 12,
          has_numbers: /\d/.test(title),
          has_questions: /\?/.test(title),
          capitalization_score: this.calculateCapitalizationScore(title),
        },
        description: {
          length: description.length,
          word_count: descriptionWords,
          optimal_length: descriptionWords >= 50 && descriptionWords <= 200,
          readability_score: this.calculateReadabilityScore(description),
        },
        tags: {
          count: tagCount,
          optimal_count: tagCount >= 5 && tagCount <= 15,
          avg_tag_length: tagCount > 0 ? tags.length / tagCount : 0,
        },
      },
      performance_metrics: {
        predicted_views: predictedViews,
        performance_category: this.getPerformanceCategory(predictedViews),
        viral_potential:
          predictedViews > 1000000
            ? "High"
            : predictedViews > 100000
            ? "Medium"
            : "Low",
        estimated_ctr: this.estimateCTR(title, predictedViews),
        estimated_engagement: Math.round(predictedViews * 0.05),
      },
    };
  }

  private static calculateCapitalizationScore(title: string): number {
    const words = title.split(/\s+/);
    const capitalizedWords = words.filter(
      (word) => word.length > 0 && word[0] === word[0].toUpperCase()
    );
    return words.length > 0
      ? (capitalizedWords.length / words.length) * 100
      : 0;
  }

  private static calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter((s) => s.length > 0);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const avgWordsPerSentence =
      sentences.length > 0 ? words.length / sentences.length : 0;

    // Simple readability score (lower is better)
    return Math.max(0, 100 - avgWordsPerSentence * 2);
  }

  private static estimateCTR(title: string, views: number): number {
    // Estimate click-through rate based on title characteristics
    let ctrScore = 5; // Base CTR of 5%

    if (/\b(how to|tutorial|guide)\b/i.test(title)) ctrScore += 2;
    if (/\b(amazing|incredible|shocking)\b/i.test(title)) ctrScore += 1;
    if (/\?/.test(title)) ctrScore += 1;
    if (/\d/.test(title)) ctrScore += 1;

    return Math.min(15, ctrScore); // Cap at 15%
  }

  private static getPerformanceCategory(views: number): string {
    if (views >= 1000000) return "Viral";
    if (views >= 500000) return "Excellent";
    if (views >= 100000) return "Good";
    if (views >= 50000) return "Average";
    if (views >= 10000) return "Below Average";
    return "Poor";
  }

  private static generateRecommendations(insights: any): string[] {
    const recommendations = [];

    // Title recommendations
    if (!insights.content_analysis.title.optimal_length) {
      if (insights.content_analysis.title.word_count < 5) {
        recommendations.push(
          "Consider making your title longer and more descriptive"
        );
      } else {
        recommendations.push(
          "Try shortening your title for better readability"
        );
      }
    }

    if (insights.content_analysis.title.capitalization_score < 50) {
      recommendations.push(
        "Use proper title case capitalization for better appeal"
      );
    }

    if (
      !insights.content_analysis.title.has_numbers &&
      insights.performance_metrics.performance_category === "Poor"
    ) {
      recommendations.push(
        'Consider adding numbers to your title (e.g., "5 Tips", "Top 10")'
      );
    }

    // Description recommendations
    if (!insights.content_analysis.description.optimal_length) {
      if (insights.content_analysis.description.word_count < 50) {
        recommendations.push(
          "Add more detail to your description to improve discoverability"
        );
      } else {
        recommendations.push(
          "Consider condensing your description for better engagement"
        );
      }
    }

    if (insights.content_analysis.description.readability_score < 60) {
      recommendations.push(
        "Improve description readability with shorter sentences"
      );
    }

    // Tags recommendations
    if (!insights.content_analysis.tags.optimal_count) {
      if (insights.content_analysis.tags.count < 5) {
        recommendations.push(
          "Add more relevant tags to improve discoverability"
        );
      } else {
        recommendations.push(
          "Focus on the most relevant tags for better targeting"
        );
      }
    }

    // Performance-based recommendations
    if (insights.performance_metrics.performance_category === "Poor") {
      recommendations.push(
        "Research trending topics in your niche for better performance"
      );
      recommendations.push(
        "Analyze successful videos in your category for inspiration"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Your content optimization looks good! Focus on quality and consistency."
      );
    }

    return recommendations;
  }

  private static calculateContentScore(insights: any): number {
    let score = 0;
    let maxScore = 0;

    // Title scoring (30 points max)
    maxScore += 30;
    if (insights.content_analysis.title.optimal_length) score += 10;
    if (insights.content_analysis.title.capitalization_score > 50) score += 10;
    if (insights.content_analysis.title.has_numbers) score += 5;
    if (insights.content_analysis.title.has_questions) score += 5;

    // Description scoring (25 points max)
    maxScore += 25;
    if (insights.content_analysis.description.optimal_length) score += 15;
    if (insights.content_analysis.description.readability_score > 60)
      score += 10;

    // Tags scoring (15 points max)
    maxScore += 15;
    if (insights.content_analysis.tags.optimal_count) score += 15;

    // Performance scoring (30 points max)
    maxScore += 30;
    const perfCategory = insights.performance_metrics.performance_category;
    if (perfCategory === "Viral") score += 30;
    else if (perfCategory === "Excellent") score += 25;
    else if (perfCategory === "Good") score += 20;
    else if (perfCategory === "Average") score += 15;
    else if (perfCategory === "Below Average") score += 10;
    else score += 5;

    return Math.round((score / maxScore) * 100);
  }
}
