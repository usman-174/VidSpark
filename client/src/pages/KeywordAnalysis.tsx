import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

// Types
interface PopularKeyword {
  term: string;
  usageCount: number;
}

interface VideoData {
  videoId: string;
  videoTitle?: string;
  title?: string;
  channelTitle?: string;
  viewCount?: number;
  subscriberCount?: number;
}

interface AnalyzeResponse {
  suggestions: string[];
  topVideos: VideoData[];
  opportunityScore: number;
  relatedKeywords: string[];
  questions: string[];
  contentGaps: string[];
  insights: string[];
}

const KeywordAnalysis = () => {
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [competingVideos, setCompetingVideos] = useState<VideoData[]>([]);
  const [opportunityScore, setOpportunityScore] = useState<number | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [contentGaps, setContentGaps] = useState<string[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([]);
  const [loadingPopularKeywords, setLoadingPopularKeywords] = useState(true);

  // New filter state for popular keywords
  const [filter, setFilter] = useState<"week" | "month" | null>(null);

  useEffect(() => {
    fetchPopularKeywords(filter);
  }, [filter]);

  const fetchPopularKeywords = async (
    filterParam?: "week" | "month" | null
  ) => {
    try {
      setLoadingPopularKeywords(true);
      const url = filterParam
        ? `/keywords/popular?filter=${filterParam}`
        : "/keywords/popular";
      const res = await axiosInstance.get<PopularKeyword[]>(url);
      setPopularKeywords(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch popular keywords:", error);
      setPopularKeywords([]);
    } finally {
      setLoadingPopularKeywords(false);
    }
  };

  const handleAnalyze = async (inputKeyword?: string) => {
    const searchKeyword = inputKeyword ?? keyword;
    if (!searchKeyword.trim()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post<AnalyzeResponse>(
        "/keywords/analyze",
        {
          keyword: searchKeyword,
        }
      );

      const data = res.data;
      setKeyword(searchKeyword);
      setSuggestions(data.suggestions || []);
      setCompetingVideos(data.topVideos || []);
      setOpportunityScore(
        typeof data.opportunityScore === "number" ? data.opportunityScore : null
      );
      setRelatedKeywords(data.relatedKeywords || []);
      setQuestions(data.questions || []);
      setContentGaps(data.contentGaps || []);
      setInsights(data.insights || []);

      // Refresh popular keywords on analyze but keep current filter
      fetchPopularKeywords(filter);
      queryClient.invalidateQueries({ queryKey: ["insights", "dashboard"] });
    } catch (error) {
      console.error("Error analyzing keyword:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-7xl mx-auto py-10 px-4 gap-6">
      <aside className="w-full md:w-[240px] bg-white shadow rounded-lg border p-4">
        <div className="flex flex-col gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            🔥 Top Search Keywords
          </h3>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {["All", "Week", "Month"].map((label) => {
              const key =
                label.toLowerCase() === "all" ? null : label.toLowerCase();
              const isActive = filter === key;

              return (
                <button
                  key={label}
                  onClick={() => setFilter(key as "week" | "month" | null)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all border ${
                    isActive
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loadingPopularKeywords ? (
          <p className="text-sm text-gray-500">Loading popular keywords...</p>
        ) : (
          <ScrollArea className="h-[300px] pr-1">
            <ul className="space-y-2">
              {popularKeywords.length > 0 ? (
                popularKeywords.map((kw, i) => (
                  <li
                    key={i}
                    onClick={() => handleAnalyze(kw.term)}
                    className="cursor-pointer p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-all flex justify-between items-center text-sm"
                    title={`Analyze "${kw.term}"`}
                  >
                    <span className="font-medium text-gray-800">{kw.term}</span>
                    <span className="text-gray-500">
                      {formatNumber(kw.usageCount)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">
                  No popular keywords found
                </li>
              )}
            </ul>
          </ScrollArea>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Keyword Explorer</CardTitle>
            <CardDescription>
              Enter a keyword to discover opportunities, competition, and ideas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. AI tools for students"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
            <Button onClick={() => handleAnalyze()} disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
              Analyze
            </Button>

            {opportunityScore !== null && (
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Opportunity Score:</h3>
                <Badge variant="secondary" className="text-lg">
                  {opportunityScore}/100
                </Badge>
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Search Suggestions:</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <Badge
                      key={i}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {competingVideos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Top Competing Videos:</h3>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {competingVideos.map((video, i) => (
                    <li key={i} className="border p-2 rounded">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {video.videoTitle || video.title || "Untitled"}
                      </a>
                      <p className="text-sm text-gray-600">
                        Channel: {video.channelTitle || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Views:{" "}
                        {video.viewCount
                          ? formatNumber(video.viewCount)
                          : "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subscribers:{" "}
                        {video.subscriberCount
                          ? formatNumber(video.subscriberCount)
                          : "N/A"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <h3 className="font-semibold mb-2">Related Keywords</h3>
                <ScrollArea className="h-40">
                  {relatedKeywords.length > 0 ? (
                    relatedKeywords.map((kw, i) => (
                      <Badge key={i} className="mr-2 mb-2" variant="secondary">
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">No related keywords found</p>
                  )}
                </ScrollArea>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Questions People Ask</h3>
                {questions.length > 0 ? (
                  <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                    {questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No questions found</p>
                )}
              </div>
            </div>

            {contentGaps.length > 0 && (
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Content Gaps</h3>
                <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                  {contentGaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.length > 0 && (
              <div className="pt-4">
                <h3 className="font-semibold mb-2">LLM-Generated Insights</h3>
                <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                  {insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default KeywordAnalysis;
