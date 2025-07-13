// types/index.ts
export interface PredictionRequest {
  title: string;
  description: string;
  tags_cleaned: string;
}

export interface ContentAnalysis {
  title: {
    length: number;
    word_count: number;
    has_numbers: boolean;
    optimal_length: boolean;
    capitalization_score?: number;
  };
  description: {
    length: number;
    word_count: number;
    optimal_length: boolean;
    readability_score?: number;
  };
  tags: {
    count: number;
    avg_tag_length: number;
    optimal_count: boolean;
  };
}

export interface PerformanceMetrics {
  performance_category: string;
  viral_potential: string;
  estimated_engagement: number;
}

export interface AnalysisResult {
  data: {
    content_score: number;
    prediction: {
      formatted_views: string;
      confidence: string;
    };
    insights: {
      content_analysis: ContentAnalysis;
      performance_metrics: PerformanceMetrics;
    };
  };
}


export interface ComparisonData {
  firstResult: AnalysisResult;
  secondResult: AnalysisResult;
  firstFormData: PredictionRequest;
  secondFormData: PredictionRequest;
}
