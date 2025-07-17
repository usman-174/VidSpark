import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { titlesAPI } from '@/api/titlesApi';
import { toast } from 'react-hot-toast';
import { favoritesQueryKeys } from './useFavoriteTitles';

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

export const useTitleGenerator = () => {
  const queryClient = useQueryClient();
  const [titles, setTitles] = useState<GeneratedTitle[]>([]);
  
  // Get favorites data from cache to sync state
  const favoritesData = queryClient.getQueryData(favoritesQueryKeys.list()) as any[] || [];
  
  // Sync local titles with favorites data whenever favorites change
  useEffect(() => {
    if (favoritesData.length >= 0) { // Check if favorites data exists (including empty array)
      setTitles(prevTitles => 
        prevTitles.map(title => ({
          ...title,
          isFavorite: favoritesData.some(fav => fav.id === title.id)
        }))
      );
    }
  }, [favoritesData]);

  // Listen for favorites query changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Listen for favorites list updates
      if (
        event.type === 'updated' && 
        event.query.queryKey.toString() === favoritesQueryKeys.list().toString()
      ) {
        const updatedFavorites = event.query.state.data as any[] || [];
        
        // Update local titles to reflect favorite status changes
        setTitles(prevTitles => 
          prevTitles.map(title => ({
            ...title,
            isFavorite: updatedFavorites.some(fav => fav.id === title.id)
          }))
        );
      }
    });

    return unsubscribe;
  }, [queryClient]);
  
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
        const currentFavorites = queryClient.getQueryData(favoritesQueryKeys.list()) as any[] || [];
        
        const formattedTitles: GeneratedTitle[] = data.titles
          .filter((t: any) => t && t.title)
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id || '',
            title: t.title || '',
            keywords: t.keywords || [],
            description: t.description || '',
            isFavorite: currentFavorites.some(fav => fav.id === (t.id || '')),
          }));
        setTitles(formattedTitles);
      } else {
        toast.error('No titles generated. Please try different keywords.');
        setTitles([]);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate titles');
      setTitles([]);
    },
  });

  // Toggle favorite mutation
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

      // Get current favorites
      const previousFavorites = queryClient.getQueryData(favoritesQueryKeys.list()) as any[] || [];
      
      // Find the title being toggled
      const currentTitle = titles.find(t => t.id === titleId);
      if (!currentTitle) return { previousFavorites };

      // Optimistically update favorites cache
      if (currentTitle.isFavorite) {
        // Remove from favorites
        const newFavorites = previousFavorites.filter(fav => fav.id !== titleId);
        queryClient.setQueryData(favoritesQueryKeys.list(), newFavorites);
      } else {
        // Add to favorites (we'd need the full title data for this)
        // For now, just update local state and let the success handler manage cache
      }

      // Optimistically update local state
      setTitles(prevTitles => 
        prevTitles.map(title => 
          title.id === titleId 
            ? { ...title, isFavorite: !title.isFavorite }
            : title
        )
      );

      return { previousFavorites };
    },
    onSuccess: (data, titleId) => {
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
      
      // Revert local state
      setTitles(prevTitles => 
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

  // Generate titles function
  const generateTitles = async (keywords: string[]) => {
    if (keywords.length < 3 || keywords.length > 5) {
      toast.error('Please enter 3-5 keywords, separated by commas.');
      return;
    }

    setTitles([]); // Clear previous titles
    await generateMutation.mutateAsync({
      prompt: keywords.join(', '),
      includeKeywords: true,
    });
  };

  // Toggle favorite function
  const toggleFavorite = async (titleId: string) => {
    if (!titleId) {
      toast.error('Title not found');
      return;
    }

    await toggleFavoriteMutation.mutateAsync(titleId);
  };

  // Clear titles
  const clearTitles = () => {
    setTitles([]);
  };

  // Helper function to check if a title is favorite (synced with cache)
  const isTitleFavorite = (titleId: string): boolean => {
    const currentFavorites = queryClient.getQueryData(favoritesQueryKeys.list()) as any[] || [];
    return currentFavorites.some(fav => fav.id === titleId);
  };

  return {
    // State
    titles,
    isGenerating: generateMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    
    // Functions
    generateTitles,
    toggleFavorite,
    clearTitles,
    isTitleFavorite,
    
    // Raw mutations if needed
    generateMutation,
    toggleFavoriteMutation,
  };
};