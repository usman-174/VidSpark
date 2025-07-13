export interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    tags?: string[];
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

export interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    tags?: string[];
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideoDetailsResponse {
  items: YouTubeVideoDetails[];
}

// Define analysis result types
export interface VideoAnalysis {
  videoId: string;
  title: string;
  views: number;
  uploadDate: Date;
  channelName: string;
  tags: string[];
  description: string;
  channelId: string;
}

export interface KeywordInsights {
  competitionScore: number;
  averageViews: number;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  contentOpportunity: 'HIGH' | 'MEDIUM' | 'LOW';
  recentVideoCount: number;
  topChannels: string[];
  aiInsights: string[];
}

export interface KeywordAnalysisResponse {
  success: boolean;
  keyword: string;
  insights: KeywordInsights;
  videoAnalysis: VideoAnalysis[];
  error?: string;
  analysisId?: string;
  isFromCache?: boolean;
}
