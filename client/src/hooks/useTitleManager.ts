import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { titlesAPI, SavedTitle } from '@/api/titlesApi';
import { toast } from 'react-hot-toast';

export interface GeneratedTitle {
  id: string;
  title: string;
  keywords: string[];
  description: string;
  isFavorite: boolean;
}

export interface GenerateRequest {
  prompt: string;
  includeKeywords?: boolean;
}

// Query keys for favorites
const favoritesQueryKeys = {
  all: ['favorites'] as const,
  list: () => [...favoritesQueryKeys.all, 'list'] as const,
} as const;

export const useTitleManager = () => {
  const queryClient = useQueryClient();
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);

  // Fetch favorites using useQuery
  const {
    data: favorites = [],
    isLoading: isFavoritesLoading,
    error: favoritesError,
    refetch: refreshFavorites,
    isError: isFavoritesError,
  } = useQuery({
    queryKey: favoritesQueryKeys.list(),
    queryFn: async () => {
      const response = await titlesAPI.getFavoriteTitles();
      if (!response.success) {
        throw new Error((response as any).error || 'Failed to fetch favorites');
      }
      return response.titles;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Sync generated titles with favorites whenever favorites change
  useEffect(() => {
    if (favorites.length >= 0) {
      setGeneratedTitles(prevTitles => 
        prevTitles.map(title => ({
          ...title,
          isFavorite: favorites.some(fav => fav.id === title.id)
        }))
      );
    }
  }, [favorites]);

  // Generate titles mutation
  const generateMutation = useMutation({
    mutationFn: async (request: GenerateRequest) => {
      const response = await titlesAPI.generateTitles(request);
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate titles');
      }
      return response;
    },
    onSuccess: (data) => {
      if (data.titles && Array.isArray(data.titles)) {
        const formattedTitles: GeneratedTitle[] = data.titles
          .filter((t: any) => t && t.title)
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id || '',
            title: t.title || '',
            keywords: t.keywords || [],
            description: t.description || '',
            isFavorite: favorites.some(fav => fav.id === (t.id || '')),
          }));
        setGeneratedTitles(formattedTitles);
      } else {
        toast.error('No titles generated. Please try different keywords.');
        setGeneratedTitles([]);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate titles');
      setGeneratedTitles([]);
    },
  });

  // Toggle favorite mutation (works for both add and remove)
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (titleId: string) => {
      const response = await titlesAPI.toggleFavoriteTitle(titleId);
      if (!response.success) {
        throw new Error('Failed to update favorite status');
      }
      return response;
    },
    onMutate: async (titleId: string) => {
      // Cancel any outgoing refetches for favorites
      await queryClient.cancelQueries({ queryKey: favoritesQueryKeys.list() });

      // Get current favorites and title
      const previousFavorites = queryClient.getQueryData<SavedTitle[]>(favoritesQueryKeys.list()) || [];
      const currentTitle = generatedTitles.find(t => t.id === titleId);
      const isCurrentlyFavorite = previousFavorites.some(fav => fav.id === titleId);

      // Optimistically update favorites cache
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const newFavorites = previousFavorites.filter(fav => fav.id !== titleId);
        queryClient.setQueryData(favoritesQueryKeys.list(), newFavorites);
      }

      // Optimistically update generated titles
      setGeneratedTitles(prevTitles => 
        prevTitles.map(title => 
          title.id === titleId 
            ? { ...title, isFavorite: !title.isFavorite }
            : title
        )
      );

      return { previousFavorites, isCurrentlyFavorite };
    },
    onSuccess: (data, titleId, context) => {
      // Invalidate and refetch favorites to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.list() });
      
      toast.success(
        data.title.isFavorite 
          ? 'Added to favorites!' 
          : 'Removed from favorites!'
      );
    },
    onError: (error: Error, titleId, context) => {
      // Revert optimistic updates
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesQueryKeys.list(), context.previousFavorites);
      }
      
      // Revert generated titles state
      setGeneratedTitles(prevTitles => 
        prevTitles.map(title => 
          title.id === titleId 
            ? { ...title, isFavorite: !title.isFavorite }
            : title
        )
      );
      
      toast.error(error.message || 'Failed to update favorite status');
    },
    onSettled: () => {
      // Ensure favorites are up to date
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.list() });
    },
  });

  // Remove favorite mutation (for favorites page)
  const removeFavoriteMutation = useMutation({
    mutationFn: async (titleId: string) => {
      const response = await titlesAPI.toggleFavoriteTitle(titleId);
      if (!response.success) {
        throw new Error('Failed to remove from favorites');
      }
      return response;
    },
    onMutate: async (titleId: string) => {
      await queryClient.cancelQueries({ queryKey: favoritesQueryKeys.list() });
      const previousFavorites = queryClient.getQueryData<SavedTitle[]>(favoritesQueryKeys.list());

      // Optimistically remove from favorites
      queryClient.setQueryData<SavedTitle[]>(
        favoritesQueryKeys.list(),
        (old = []) => old.filter(title => title.id !== titleId)
      );

      return { previousFavorites };
    },
    onSuccess: () => {
      toast.success('Removed from favorites!');
    },
    onError: (error: Error, titleId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesQueryKeys.list(), context.previousFavorites);
      }
      toast.error(error.message || 'Failed to remove from favorites');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.list() });
    },
  });

  // Generate titles function
  const generateTitles = async (keywords: string[]) => {
    if (keywords.length < 3 || keywords.length > 5) {
      toast.error('Please enter 3-5 keywords, separated by commas.');
      return;
    }

    setGeneratedTitles([]); // Clear previous titles
    await generateMutation.mutateAsync({
      prompt: keywords.join(', '),
      includeKeywords: true,
    });
  };

  // Toggle favorite function (for generated titles)
  const toggleFavorite = async (titleId: string) => {
    if (!titleId) {
      toast.error('Title not found');
      return;
    }
    await toggleFavoriteMutation.mutateAsync(titleId);
  };

  // Remove favorite function (for favorites page)
  const removeFavorite = async (titleId: string) => {
    if (!titleId) {
      toast.error('Title not found');
      return;
    }
    await removeFavoriteMutation.mutateAsync(titleId);
  };

  // Clear generated titles
  const clearTitles = () => {
    setGeneratedTitles([]);
  };

  // Helper functions
  const isTitleFavorite = (titleId: string): boolean => {
    return favorites.some(fav => fav.id === titleId);
  };

  const isFavorite = (titleId: string): boolean => {
    return favorites.some(title => title.id === titleId);
  };

  return {
    // Generated titles state
    generatedTitles,
    isGenerating: generateMutation.isPending,
    
    // Favorites state
    favorites,
    isFavoritesLoading,
    favoritesError: isFavoritesError ? (favoritesError as Error)?.message : null,
    
    // Mutation states
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isRemoving: removeFavoriteMutation.isPending,
    isMutating: toggleFavoriteMutation.isPending || removeFavoriteMutation.isPending,
    
    // Functions for generated titles
    generateTitles,
    toggleFavorite,
    clearTitles,
    isTitleFavorite,
    
    // Functions for favorites page
    removeFavorite,
    refreshFavorites,
    isFavorite,
    
    // Raw mutations if needed
    generateMutation,
    toggleFavoriteMutation,
    removeFavoriteMutation,
  };
};