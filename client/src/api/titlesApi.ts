//src/api/titlesApi.ts
import axios from "./axiosInstance";

// Interface for a title with keywords
interface TitleWithKeywords {
  title: string;
  keywords: string[];
}

// Interface for a saved title with ID
export interface SavedTitle {
  id: string;
  title: string;
  keywords: string[];
  isFavorite: boolean;
  generation?: {
    prompt: string;
    createdAt: string;
  };
}

// Interface for generation details
export interface TitleGeneration {
  id: string;
  prompt: string;
  createdAt: string;
  provider?: string;
  titles: SavedTitle[];
}

// Interface for paginated generations response
export interface PaginatedGenerationsResponse {
  success: boolean;
  generations: TitleGeneration[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Title generation options
export interface TitleGenerationOptions {
  prompt: string;
  maxLength?: number;
  model?: string;
  includeKeywords?: boolean;
  saveTitles?: boolean;
}

// Title generation response
export interface TitleGenerationResponse {
  success: boolean;
  titles: string[] | TitleWithKeywords[];
  provider?: string;
  error?: string;
  generationId?: string;
}

// Response for getting generation by ID
export interface GenerationByIdResponse {
  success: boolean;
  generation: TitleGeneration;
}

// Response for toggling favorite
export interface ToggleFavoriteResponse {
  success: boolean;
  title: SavedTitle;
}

// Response for getting favorites
export interface FavoriteTitlesResponse {
  success: boolean;
  titles: SavedTitle[];
}

export const titlesAPI = {
  // Generate titles
  generateTitles: async ({
    prompt,
    maxLength = 400,
    
    includeKeywords = true,
    saveTitles = true,
  }: TitleGenerationOptions): Promise<TitleGenerationResponse> => {
    try {
      const response = await axios.post<TitleGenerationResponse>("/titles/generate", {
        prompt,
        maxLength,
     
        includeKeywords,
        saveTitles,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error generating titles:", error);
      const errorMessage = error.response?.data?.message || "Failed to generate titles. Please try again.";
      return {
        success: false,
        titles: [],
        error: errorMessage
      };
    }
  },

  // Get all title generations with pagination
  getUserTitleGenerations: async (page: number = 1, limit: number = 10): Promise<PaginatedGenerationsResponse> => {
    try {
      const response = await axios.get<PaginatedGenerationsResponse>(
        `/titles/generations?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching title generations:", error);
      throw error;
    }
  },

  // Get a specific title generation by ID
  getTitleGenerationById: async (id: string): Promise<GenerationByIdResponse> => {
    try {
      const response = await axios.get<GenerationByIdResponse>(`/titles/generations/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching title generation:", error);
      throw error;
    }
  },

  // Toggle favorite status for a title
  toggleFavoriteTitle: async (titleId: string): Promise<ToggleFavoriteResponse> => {
    try {
      const response = await axios.put<ToggleFavoriteResponse>(`/titles/${titleId}/favorite`);
      return response.data;
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      throw error;
    }
  },

  // Get all favorite titles
  getFavoriteTitles: async (): Promise<FavoriteTitlesResponse> => {
    try {
      const response = await axios.get<FavoriteTitlesResponse>('/titles/favorites');
      return response.data;
    } catch (error) {
      console.error("Error fetching favorite titles:", error);
      throw error;
    }
  }
};