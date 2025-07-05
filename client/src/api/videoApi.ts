// # src/api/videosApi.ts
import axios from "./axiosInstance";

export interface Video {
  id: string;
  title: string;
  videoId: string;
  channelTitle: string;
  uploadedAt: string;
  duration: string;
  thumbnailLink: string;
  viewCount: number;
  thumbnail?: string;
  views?: number;
  likes?: number;
  commentCount?: number;
  publishedAt?: string;
  category?: {
    title: string;
  };
}

export interface VideoResponse {
  videos: Video[];
  metadata: {
    totalVideos: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export const videosAPI = {
  getVideos: async ({ page = 1, limit = 10 }): Promise<VideoResponse> => {
    const { data } = await axios.get(`/videos?page=${page}&limit=${limit}`);
    return data;
  },
  deleteVideo: (videoId: string) => axios.delete(`/videos/${videoId}`),
  scrapeVideos: () => axios.post("/videos/scrape"),
};
