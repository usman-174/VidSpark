// src/api/evaluationApi.ts
import axiosInstance from "./axiosInstance";

// Request interfaces
export interface PredictionRequest {
  title: string;
  description: string;
  tags_cleaned: string;
}

export interface BatchPredictionRequest {
  videos: PredictionRequest[];
}

// Response interfaces - Updated to match actual API response
export interface PredictionResult {
  predicted_views: number;
  confidence: string; // Changed from number to string (e.g., "Medium")
  formatted_views: string;
}

export interface ContentAnalysis {
  title: {
    length: number;
    word_count: number;
    optimal_length: boolean;
    has_numbers: boolean;
    has_questions: boolean;
    capitalization_score: number;
  };
  description: {
    length: number;
    word_count: number;
    optimal_length: boolean;
    readability_score: number;
  };
  tags: {
    count: number;
    optimal_count: boolean;
    avg_tag_length: number; // Changed from average_length to avg_tag_length
  };
}

export interface PerformanceMetrics {
  predicted_views: number;
  performance_category: string; // Changed to string to handle any category
  viral_potential: string; // Added based on actual response
  estimated_ctr: number; // Added based on actual response
  estimated_engagement: number; // Added based on actual response
}

export interface ContentInsights {
  content_analysis: ContentAnalysis;
  performance_metrics: PerformanceMetrics;
  // Removed seo_analysis as it doesn't exist in actual response
}

// Simplified recommendation interface - API returns array of strings
export type Recommendation = string;

export interface AnalysisResponse {
  success: boolean;
  data: {
    prediction: PredictionResult;
    insights: ContentInsights;
    recommendations: Recommendation[]; // Changed to array of strings
    content_score: number;
  };
  message: string;
}

export interface HealthResponse {
  success: boolean;
  status?: 'healthy' | 'unhealthy';
  python_api?: boolean;
  latency?: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

// API functions
export const evaluationAPI = {
  // Health check - Check if ML service is available
  getHealth: (): Promise<HealthResponse> =>
    axiosInstance.get("/evaluation/health").then((res) => res.data),

  // Single prediction - Get view prediction for one video
  predictViews: (request: PredictionRequest): Promise<ApiResponse<PredictionResult>> =>
    axiosInstance.post("/evaluation/predict", request).then((res) => res.data),

  // Batch predictions - Get predictions for multiple videos
  batchPredict: (request: BatchPredictionRequest): Promise<ApiResponse<PredictionResult[]>> =>
    axiosInstance.post("/evaluation/batch-predict", request).then((res) => res.data),

  // Content analysis - Get detailed insights and recommendations
  analyzeContent: (request: PredictionRequest): Promise<AnalysisResponse> =>
    axiosInstance.post("/evaluation/analyze", request).then((res) => res.data),
};