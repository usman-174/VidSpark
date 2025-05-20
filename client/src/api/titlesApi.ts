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
  // Include the generation info nested inside the title response
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

// Extend the current options interface with the new includeKeywords parameter
export interface TitleGenerationOptions {
  prompt: string;
  maxLength?: number;
  model?: string;
  includeKeywords?: boolean;
  saveTitles?: boolean;
}

// Update the response interface to handle either string arrays or TitleWithKeywords arrays
export interface TitleGenerationResponse {
  success: boolean;
  titles: string[] | TitleWithKeywords[];
  provider?: string;
  error?: string;
  generationId?: string;
}

export const titlesAPI = {
  // Generate titles
  generateTitles: ({
    prompt,
    maxLength = 400,
    model = "deepseek/deepseek-chat-v3-0324:free",
    includeKeywords = false,
    saveTitles = true,
  }: TitleGenerationOptions): Promise<TitleGenerationResponse> => {
    return axios
      .post<TitleGenerationResponse>("/titles/generate", {
        prompt,
        maxLength,
        model,
        includeKeywords,
        saveTitles,
      })
      .then((res) => res.data)
      .catch((error) => {
        console.error("Error generating titles:", error);
        // Create a user-friendly error message
        const errorMessage = error.response?.data?.message || 
                            "Failed to generate titles. Please try again.";
        
        // Return a structured error response
        return {
          success: false,
          titles: [],
          error: errorMessage
        };
      });
  },

  // Get all title generations with pagination
  getUserTitleGenerations: (page: number = 1, limit: number = 10): Promise<PaginatedGenerationsResponse> => {
    return axios
      .get<PaginatedGenerationsResponse>(`/titles/generations?page=${page}&limit=${limit}`)
      .then((res) => res.data)
      .catch((error) => {
        console.error("Error fetching title generations:", error);
        throw error;
      });
  },

  // Get a specific title generation by ID
  getTitleGenerationById: (id: string): Promise<{ success: boolean; generation: TitleGeneration }> => {
    return axios
      .get(`/titles/generations/${id}`)
      .then((res) => res.data)
      .catch((error) => {
        console.error("Error fetching title generation:", error);
        throw error;
      });
  },

  // Toggle favorite status for a title
  toggleFavoriteTitle: (titleId: string): Promise<{ success: boolean; title: SavedTitle }> => {
    return axios
      .put(`/titles/${titleId}/favorite`)
      .then((res) => res.data)
      .catch((error) => {
        console.error("Error toggling favorite status:", error);
        throw error;
      });
  },

  // Get all favorite titles
  getFavoriteTitles: (): Promise<{ success: boolean; titles: SavedTitle[] }> => {
    return axios
      .get('/titles/favorites')
      .then((res) => res.data)
      .catch((error) => {
        console.error("Error fetching favorite titles:", error);
        throw error;
      });
  }
};