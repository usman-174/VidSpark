// src/hooks/useTitleGenerations.ts
import { useState, useCallback } from 'react';
import { titlesAPI, TitleGeneration, SavedTitle } from '@/api/titlesApi';
import { toast } from './use-toast';


interface UseTitleGenerationsReturn {
  generations: TitleGeneration[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  favorites: SavedTitle[];
  loadingFavorites: boolean;
  
  // Methods
  fetchGenerations: (page?: number, limit?: number) => Promise<void>;
  fetchGeneration: (id: string) => Promise<TitleGeneration | null>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (titleId: string) => Promise<boolean>;
}

export function useTitleGenerations(): UseTitleGenerationsReturn {
  const [generations, setGenerations] = useState<TitleGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<SavedTitle[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  // Fetch paginated generations
  const fetchGenerations = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await titlesAPI.getUserTitleGenerations(page, limit);
      if (response.success) {
        setGenerations(response.generations);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch generation history');
      }
    } catch (err) {
      console.error('Error fetching generations:', err);
      setError('An error occurred while fetching generations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single generation by ID
  const fetchGeneration = useCallback(async (id: string): Promise<TitleGeneration | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await titlesAPI.getTitleGenerationById(id);
      if (response.success) {
        return response.generation;
      } else {
        setError('Failed to fetch generation');
        return null;
      }
    } catch (err) {
      console.error('Error fetching generation:', err);
      setError('An error occurred while fetching the generation');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch favorite titles
  const fetchFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    
    try {
      const response = await titlesAPI.getFavoriteTitles();
      if (response.success) {
        setFavorites(response.titles);
      } else {
        toast({
          title: "Failed to fetch favorites",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      toast({
        title: "Error fetching favorites",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (titleId: string): Promise<boolean> => {
    try {
      const response = await titlesAPI.toggleFavoriteTitle(titleId);
      if (response.success) {
        // If we have the favorites loaded, update them
        if (favorites.length > 0) {
          if (response.title.isFavorite) {
            // Add to favorites if not already there
            setFavorites(prev => {
              if (!prev.some(t => t.id === titleId)) {
                return [...prev, response.title];
              }
              return prev;
            });
          } else {
            // Remove from favorites
            setFavorites(prev => prev.filter(t => t.id !== titleId));
          }
        }
        
        // Also update in generations if present
        setGenerations(prev => 
          prev.map(gen => ({
            ...gen,
            titles: gen.titles.map(t => 
              t.id === titleId 
                ? { ...t, isFavorite: response.title.isFavorite } 
                : t
            )
          }))
        );
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast({
        title: "Failed to update favorite",
        description: "Please try again later",
        variant: "destructive",
      });
      return false;
    }
  }, [favorites]);

  return {
    generations,
    loading,
    error,
    pagination,
    favorites,
    loadingFavorites,
    fetchGenerations,
    fetchGeneration,
    fetchFavorites,
    toggleFavorite
  };
}