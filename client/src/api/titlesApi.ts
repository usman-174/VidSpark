//src/api/titlesApi.ts

import axios from "./axiosInstance";

export interface TitleGenerationOptions {
  prompt: string;
  maxLength?: number;
  model?: string;
}

export interface TitleGenerationResponse {
  success: boolean;
  titles: string[];
  error?: string;
}

export const titlesAPI = {
  generateTitles: ({
    prompt,
    maxLength = 400,
    model = "deepseek/deepseek-chat-v3-0324:free",
  }: TitleGenerationOptions): Promise<TitleGenerationResponse> => {
    return axios
      .post<TitleGenerationResponse>("/titles/generate", {
        prompt,
        maxLength,
        model,
      })
      .then((res) => res.data);
  },
};
