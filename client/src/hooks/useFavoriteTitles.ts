import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { titlesAPI, SavedTitle } from '@/api/titlesApi';
import { toast } from 'react-hot-toast';

// Query keys for favorites
export const favoritesQueryKeys = {
  all: ['favorites'] as const,
  list: () => [...favoritesQueryKeys.all, 'list'] as const,
} as const;

export const useFavoriteTitles = () => {
  const queryClient = useQueryClient();

  // Fetch favorites using useQuery
  const {
    data: favorites = [],
    isLoading,
    error,
    refetch: refreshFavorites,
    isError,
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

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (titleId: string) => {
      const response = await titlesAPI.toggleFavoriteTitle(titleId);
      if (!response.success) {
        throw new Error('Failed to remove from favorites');
      }
      return response;
    },
    onMutate: async (titleId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoritesQueryKeys.list() });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData<SavedTitle[]>(favoritesQueryKeys.list());

      // Optimistically update to remove the title
      queryClient.setQueryData<SavedTitle[]>(
        favoritesQueryKeys.list(),
        (old = []) => old.filter(title => title.id !== titleId)
      );

      // Return a context object with the snapshotted value
      return { previousFavorites };
    },
    onSuccess: () => {
      toast.success('Removed from favorites!');
    },
    onError: (error: Error, titleId, context) => {
      // Revert the optimistic update on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoritesQueryKeys.list(), context.previousFavorites);
      }
      toast.error(error.message || 'Failed to remove from favorites');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.list() });
    },
  });

  // Add to favorites mutation (if needed)
  const addFavoriteMutation = useMutation({
    mutationFn: async (titleId: string) => {
      const response = await titlesAPI.toggleFavoriteTitle(titleId);
      if (!response.success) {
        throw new Error('Failed to add to favorites');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch favorites list
      queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.list() });
      toast.success('Added to favorites!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to favorites');
    },
  });

  // Remove favorite function with validation
  const removeFavorite = async (titleId: string) => {
    if (!titleId) {
      toast.error('Title not found');
      return;
    }

    await removeFavoriteMutation.mutateAsync(titleId);
  };

  // Add favorite function
  const addFavorite = async (titleId: string) => {
    if (!titleId) {
      toast.error('Title not found');
      return;
    }

    await addFavoriteMutation.mutateAsync(titleId);
  };

  // Check if title is favorited
  const isFavorite = (titleId: string): boolean => {
    return favorites.some(title => title.id === titleId);
  };

  // Toggle favorite status
  const toggleFavorite = async (titleId: string) => {
    if (isFavorite(titleId)) {
      await removeFavorite(titleId);
    } else {
      await addFavorite(titleId);
    }
  };

  return {
    // Data
    favorites,
    isLoading,
    error: isError ? (error as Error)?.message : null,
    
    // Functions
    removeFavorite,
    addFavorite,
    toggleFavorite,
    refreshFavorites,
    isFavorite,
    
    // Mutation states
    isRemoving: removeFavoriteMutation.isPending,
    isAdding: addFavoriteMutation.isPending,
    isMutating: removeFavoriteMutation.isPending || addFavoriteMutation.isPending,
  };
};