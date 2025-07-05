// src/hooks/useTitleGeneration.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { titlesAPI, TitleGeneration, SavedTitle } from '@/api/titlesApi';
import { toast } from '@/hooks/use-toast';

// Query keys for title generation
export const titleQueryKeys = {
  generations: ['title-generations'] as const,
  generation: (id: string) => ['title-generation', id] as const,
  favorites: ['title-favorites'] as const,
  userGenerations: (page: number, limit: number) => ['user-title-generations', page, limit] as const,
} as const;

// Hook for generating titles with mutation
export const useGenerateTitles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: any) => {
      const response = await titlesAPI.generateTitles(request);
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate titles');
      }
      return response;
    },
    onSuccess: (data) => {
      // Invalidate and refetch user insights after successful generation
      queryClient.invalidateQueries({ queryKey: ['insights', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'quick-stats'] });
      
      // If we have a generation ID, prefetch it
      if (data.generationId) {
        queryClient.prefetchQuery({
          queryKey: titleQueryKeys.generation(data.generationId),
          queryFn: () => titlesAPI.getTitleGenerationById(data.generationId!),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate titles",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
};

// Hook for fetching user's title generations with pagination
export const useUserTitleGenerations = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: titleQueryKeys.userGenerations(page, limit),
    queryFn: async () => {
      const response = await titlesAPI.getUserTitleGenerations(page, limit);
      if (!response.success) {
        throw new Error('Failed to fetch generation history');
      }
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
};

// Hook for fetching a specific generation by ID
export const useTitleGeneration = (id: string | null) => {
  return useQuery({
    queryKey: titleQueryKeys.generation(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('No generation ID provided');
      
      const response = await titlesAPI.getTitleGenerationById(id);
      if (!response.success) {
        throw new Error('Failed to fetch generation');
      }
      return response.generation;
    },
    enabled: !!id, // Only run query if id exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for fetching favorite titles
export const useFavoriteTitles = () => {
  return useQuery({
    queryKey: titleQueryKeys.favorites,
    queryFn: async () => {
      const response = await titlesAPI.getFavoriteTitles();
      if (!response.success) {
        throw new Error('Failed to fetch favorites');
      }
      return response.titles;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for toggling favorite status
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (titleId: string) => {
      const response = await titlesAPI.toggleFavoriteTitle(titleId);
      if (!response.success) {
        throw new Error('Failed to update favorite status');
      }
      return response;
    },
    onMutate: async (titleId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: titleQueryKeys.favorites });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData<SavedTitle[]>(titleQueryKeys.favorites);

      // Optimistically update the cache
      queryClient.setQueryData<SavedTitle[]>(titleQueryKeys.favorites, (old) => {
        if (!old) return old;
        
        // Check if the title is currently in favorites
        const existingTitle = old.find(t => t.id === titleId);
        if (existingTitle) {
          // Remove from favorites (unfavoriting)
          return old.filter(t => t.id !== titleId);
        }
        // If not in favorites, we can't add it here because we don't have the full title data
        return old;
      });

      // Also update any cached generations
      const generationQueries = queryClient.getQueriesData({ 
        queryKey: titleQueryKeys.userGenerations(1, 10) 
      });
      
    

      return { previousFavorites };
    },
    onError: (error, titleId, context) => {
      // Revert optimistic update on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(titleQueryKeys.favorites, context.previousFavorites);
      }
      
      toast({
        title: "Failed to update favorite",
        description: "Please try again later",
        variant: "destructive",
      });
    },
    onSuccess: (data, titleId) => {
      // Update favorites list based on the response
      queryClient.setQueryData<SavedTitle[]>(titleQueryKeys.favorites, (old) => {
        if (!old) return [data.title];
        
        if (data.title.isFavorite) {
          // Add to favorites if not already there
          const exists = old.some(t => t.id === titleId);
          return exists ? old : [...old, data.title];
        } else {
          // Remove from favorites
          return old.filter(t => t.id !== titleId);
        }
      });

      // Show success message
      toast({
        title: data.title.isFavorite ? "Added to favorites" : "Removed from favorites",
        description: data.title.isFavorite
          ? "Title has been added to your favorites"
          : "Title has been removed from your favorites",
      });
    },
    onSettled: () => {
      // Always refetch favorites to ensure consistency
      queryClient.invalidateQueries({ queryKey: titleQueryKeys.favorites });
    },
  });
};

// Composite hook that provides the same interface as your original hook
export function useTitleGenerations(page: number = 1, limit: number = 10) {
  const { 
    data: generationsData, 
    isLoading: loading, 
    error: generationsError,
    refetch: refetchGenerations 
  } = useUserTitleGenerations(page, limit);

  const { 
    data: favorites = [], 
    isLoading: loadingFavorites, 
    error: favoritesError,
    refetch: refetchFavorites 
  } = useFavoriteTitles();

  const { mutateAsync: toggleFavoriteMutation } = useToggleFavorite();
  const queryClient = useQueryClient();

  // Format error messages
  const error = generationsError?.message || favoritesError?.message || null;

  // Provide the same interface as your original hook
  const fetchGenerations = async (newPage?: number, newLimit?: number) => {
    if (newPage !== undefined || newLimit !== undefined) {
      // If page or limit changed, we need to use the new hook parameters
      // This is handled by the component re-rendering with new parameters
      return;
    }
    await refetchGenerations();
  };

  const fetchGeneration = async (id: string): Promise<TitleGeneration | null> => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: titleQueryKeys.generation(id),
        queryFn: async () => {
          const response = await titlesAPI.getTitleGenerationById(id);
          if (!response.success) {
            throw new Error('Failed to fetch generation');
          }
          return response.generation;
        },
      });
      return data;
    } catch (error) {
      console.error('Error fetching generation:', error);
      return null;
    }
  };

  const fetchFavorites = async () => {
    await refetchFavorites();
  };

  const toggleFavorite = async (titleId: string): Promise<boolean> => {
    try {
      await toggleFavoriteMutation(titleId);
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  return {
    generations: generationsData?.generations || [],
    loading,
    error,
    pagination: generationsData?.pagination || {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0
    },
    favorites,
    loadingFavorites,
    
    // Methods
    fetchGenerations,
    fetchGeneration,
    fetchFavorites,
    toggleFavorite,
  };
}

// Additional utility hooks for specific use cases

// Hook for prefetching next page
export const usePrefetchNextPage = (currentPage: number, limit: number, hasNextPage: boolean) => {
  const queryClient = useQueryClient();

  const prefetchNextPage = () => {
    if (hasNextPage) {
      queryClient.prefetchQuery({
        queryKey: titleQueryKeys.userGenerations(currentPage + 1, limit),
        queryFn: () => titlesAPI.getUserTitleGenerations(currentPage + 1, limit),
        staleTime: 2 * 60 * 1000,
      });
    }
  };

  return { prefetchNextPage };
};

// Hook for invalidating all title-related cache
export const useInvalidateTitleCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['title-'] });
  };

  const invalidateFavorites = () => {
    queryClient.invalidateQueries({ queryKey: titleQueryKeys.favorites });
  };

  const invalidateGenerations = () => {
    queryClient.invalidateQueries({ queryKey: titleQueryKeys.generations });
  };

  return {
    invalidateAll,
    invalidateFavorites,
    invalidateGenerations,
  };
};