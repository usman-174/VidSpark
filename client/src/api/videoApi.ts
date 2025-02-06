// # src/api/videosApi.ts
import axios from "./axiosInstance";

export interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailLink: string;
  viewCount: number;
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
