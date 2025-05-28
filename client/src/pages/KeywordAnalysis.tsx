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

  // Popular keywords with usageCount (updated)
  const [popularKeywords, setPopularKeywords] = useState<
    { term: string; usageCount: number }[]
  >([]);
  const [loadingPopularKeywords, setLoadingPopularKeywords] = useState(true);

  // Fetch popular keywords on mount
  useEffect(() => {
    const fetchPopularKeywords = async () => {
      try {
        setLoadingPopularKeywords(true);
        const res = await axiosInstance.get("/keywords/popular");
        console.log("Popular keywords response:", res.data);
        if (Array.isArray(res.data)) {
          setPopularKeywords(res.data);
        } else {
          console.error("Popular keywords response is not an array");
          setPopularKeywords([]);
        }
      } catch (error) {
        console.error("Failed to fetch popular keywords:", error);
        setPopularKeywords([]);
      } finally {
        setLoadingPopularKeywords(false);
      }
    };

    fetchPopularKeywords();
  }, []);

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;
    setLoading(true);

    try {
      const res = await axiosInstance.post("/keywords/analyze", { keyword });
      console.log("Analyze keyword response:", res.data);

      const data = res.data;
      setSuggestions(data.suggestions || []);
      setCompetingVideos(data.topVideos || []); // use topVideos key as per backend
      setOpportunityScore(data.opportunityScore || null);
      setRelatedKeywords(data.relatedKeywords || []);
      setQuestions(data.questions || []);
      setContentGaps(data.contentGaps || []);
      setInsights(data.insights || []);

      // Refresh popular keywords after new search
      const popularRes = await axiosInstance.get("/keywords/popular");
      if (Array.isArray(popularRes.data)) {
        setPopularKeywords(popularRes.data);
      }
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
        <h3 className="font-semibold mb-4 text-lg">🔥 Top Keywords</h3>
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
                  >
                    <span className="font-medium">{kw.term}</span>
                    <span className="text-sm text-gray-600">
                       {kw.usageCount ? Number(kw.usageCount).toFixed(1) : "N/A"}
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
            />
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin mr-2 w-4 h-4" />
              ) : null}
              Analyze
            </Button>

            {opportunityScore !== null && (
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Opportunity Score:</h3>
                <Badge>{opportunityScore}/100</Badge>
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Search Suggestions:</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <Badge key={i}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {competingVideos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Top Competing Videos:</h3>
                <ul className="space-y-2">
                  {competingVideos.map((video, i) => (
                    <li key={i} className="border p-2 rounded">
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm">Views: {video.viewCount}</p>
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
                      <Badge key={i} className="mr-2 mb-2">
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
                  <ul className="list-disc pl-5">
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
                <ul className="list-disc pl-5">
                  {contentGaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.length > 0 && (
              <div className="pt-4">
                <h3 className="font-semibold mb-2">LLM-Generated Insights</h3>
                <ul className="list-disc pl-5">
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
