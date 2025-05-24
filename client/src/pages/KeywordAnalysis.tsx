import { useState } from "react";
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

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;
    setLoading(true);

    try {
      const res = await axiosInstance.post("/api/keywords/analyze", { keyword });
      const data = res.data;
      setSuggestions(data.suggestions || []);
      setCompetingVideos(data.competingVideos || []);
      setOpportunityScore(data.opportunityScore || null);
      setRelatedKeywords(data.relatedKeywords || []);
      setQuestions(data.questions || []);
      setContentGaps(data.contentGaps || []);
      setInsights(data.insights || []);
    } catch (error) {
      console.error("Error analyzing keyword:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
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
            {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
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
                {relatedKeywords.map((kw, i) => (
                  <Badge key={i} className="mr-2 mb-2">
                    {kw}
                  </Badge>
                ))}
              </ScrollArea>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Questions People Ask</h3>
              <ul className="list-disc pl-5">
                {questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
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
    </div>
  );
};

export default KeywordAnalysis;
