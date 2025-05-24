export interface VideoAnalysis {
  videoId: string;
  title: string;
  channelTitle: string;
}

export interface KeywordAnalysisResult {
  keyword: string;
  suggestions: string[];
  topVideos: VideoAnalysis[];
  opportunityScore: number;
}
