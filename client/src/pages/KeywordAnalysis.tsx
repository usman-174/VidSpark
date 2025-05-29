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

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

const KeywordAnalysis = () => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [competingVideos, setCompetingVideos] = useState<any[]>([]);
  const [opportunityScore, setOpportunityScore] = useState<number | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [contentGaps, setContentGaps] = useState<string[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const [popularKeywords, setPopularKeywords] = useState<
    { term: string; usageCount: number }[]
  >([]);
  const [loadingPopularKeywords, setLoadingPopularKeywords] = useState(true);

  useEffect(() => {
    fetchPopularKeywords();
  }, []);

  const fetchPopularKeywords = async () => {
    try {
      setLoadingPopularKeywords(true);
      const res = await axiosInstance.get("/keywords/popular");
      if (Array.isArray(res.data)) {
        setPopularKeywords(res.data);
      } else {
        setPopularKeywords([]);
      }
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
      const res = await axiosInstance.post("/keywords/analyze", {
        keyword: searchKeyword,
      });

      const data = res.data;
      setKeyword(searchKeyword);

      setSuggestions(data.suggestions || []);
      setCompetingVideos(data.topVideos || []);
      setOpportunityScore(
        typeof data.opportunityScore === "number" ? data.opportunityScore : null
      );

      // Make sure your backend returns these fields in the response!
      setRelatedKeywords(data.relatedKeywords || []);
      setQuestions(data.questions || []);
      setContentGaps(data.contentGaps || []);
      setInsights(data.insights || []);

      await fetchPopularKeywords();
    } catch (error) {
      console.error("Error analyzing keyword:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-7xl mx-auto py-10 px-4 gap-6">
      {/* Sidebar for Top Keywords */}
      <aside className="w-full md:w-1/4 border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-4 text-lg">🔥Most Searched Keywords</h3>
        {loadingPopularKeywords ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <ScrollArea className="h-[500px] pr-2">
            <ul className="space-y-2">
              {popularKeywords.length > 0 ? (
                popularKeywords.map((kw, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center p-2 bg-white rounded shadow-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleAnalyze(kw.term)}
                    title={`Analyze "${kw.term}"`}
                  >
                    <span className="font-medium">{kw.term}</span>
                    <span className="text-sm text-gray-600">
                      {kw.usageCount ? formatNumber(kw.usageCount) : "N/A"}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No popular keywords found</li>
              )}
            </ul>
          </ScrollArea>
        )}
      </aside>

      {/* Main Keyword Analyzer */}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnalyze();
              }}
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
                    <Badge key={i} variant="outline">
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
                          ? formatNumber(Number(video.viewCount))
                          : "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subscribers:{" "}
                        {video.subscriberCount
                          ? formatNumber(Number(video.subscriberCount))
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
