// src/hooks/useEvaluation.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { evaluationAPI, PredictionRequest, BatchPredictionRequest } from '@/api/evaluationApi';
import { toast } from '@/hooks/use-toast';

// Query keys for evaluation
export const evaluationQueryKeys = {
  health: ['evaluation', 'health'] as const,
  analysis: (content: PredictionRequest) => ['evaluation', 'analysis', content] as const,
  prediction: (content: PredictionRequest) => ['evaluation', 'prediction', content] as const,
} as const;

// Hook for checking ML service health
export const useEvaluationHealth = () => {
  return useQuery({
    queryKey: evaluationQueryKeys.health,
    queryFn: evaluationAPI.getHealth,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });
};

// Hook for content analysis with caching
export const useAnalyzeContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PredictionRequest) => {
      // Validate input
      if (!request.title?.trim()) {
        throw new Error('Title is required');
      }
      if (!request.description?.trim()) {
        throw new Error('Description is required');
      }
      if (!request.tags_cleaned?.trim()) {
        throw new Error('Tags are required');
      }

      const response = await evaluationAPI.analyzeContent(request);
      if (!response.success) {
        throw new Error(response.message || 'Analysis failed');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Cache the analysis result
      queryClient.setQueryData(
        evaluationQueryKeys.analysis(variables),
        data,
        { updatedAt: Date.now() }
      );

      // Invalidate insights to reflect new usage
      queryClient.invalidateQueries({ queryKey: ['insights', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'quick-stats'] });

      toast({
        title: "Analysis Complete",
        description: `Content scored ${data.data.content_score}/100 with ${data.data.prediction.formatted_views} predicted views`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Please check your input and try again",
        variant: "destructive",
      });
    },
  });
};

// Hook for simple view prediction
export const usePredictViews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: PredictionRequest) => {
      const response = await evaluationAPI.predictViews(request);
      if (!response.success) {
        throw new Error(response.error || 'Prediction failed');
      }
      return response.data!;
    },
    onSuccess: (data, variables) => {
      // Cache the prediction result
      queryClient.setQueryData(
        evaluationQueryKeys.prediction(variables),
        data,
        { updatedAt: Date.now() }
      );

      toast({
        title: "Prediction Complete",
        description: `Predicted views: ${data.formatted_views}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Prediction Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });
};

// Hook for batch predictions
export const useBatchPredict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BatchPredictionRequest) => {
      if (!request.videos?.length) {
        throw new Error('At least one video is required');
      }
      if (request.videos.length > 50) {
        throw new Error('Maximum 50 videos allowed per batch');
      }

      const response = await evaluationAPI.batchPredict(request);
      if (!response.success) {
        throw new Error(response.error || 'Batch prediction failed');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // Invalidate insights after successful batch analysis
      queryClient.invalidateQueries({ queryKey: ['insights', 'dashboard'] });

      toast({
        title: "Batch Analysis Complete",
        description: `Successfully analyzed ${data.length} videos`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Batch Analysis Failed",
        description: error.message || "Please check your input and try again",
        variant: "destructive",
      });
    },
  });
};

// Hook for getting cached analysis result
export const useCachedAnalysis = (request: PredictionRequest | null) => {
  return useQuery({
    queryKey: request ? evaluationQueryKeys.analysis(request) : ['evaluation', 'analysis', 'null'],
    queryFn: () => null, // We only want cached data
    enabled: false, // Never fetch, only return cached data
    staleTime: Infinity, // Cache indefinitely until manually invalidated
  });
};

// Utility hook for prefetching health status
export const usePrefetchHealth = () => {
  const queryClient = useQueryClient();

  const prefetchHealth = () => {
    queryClient.prefetchQuery({
      queryKey: evaluationQueryKeys.health,
      queryFn: evaluationAPI.getHealth,
      staleTime: 30 * 1000,
    });
  };

  return { prefetchHealth };
};