import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  History,
  ExternalLink,
  Clock,
  Search,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/store/authStore";
import {
  keywordAnalysisAPI,
  keywordAnalysisUtils,
} from "@/api/keywordAnalysisApi";

interface KeywordAnalysisSidebarProps {
  onKeywordClick: (keyword: string) => void;
}

const KeywordAnalysisSidebar = ({
  onKeywordClick,
}: KeywordAnalysisSidebarProps) => {
  const { user } = useAuthStore();
  const [isTrendingDialogOpen, setIsTrendingDialogOpen] = useState(false);

  // Fetch trending keywords (limited for sidebar)
  const { data: trendingData } = useQuery({
    queryKey: ["trending-keywords"],
    queryFn: () => keywordAnalysisAPI.getTrending({ limit: 5 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all trending keywords (for dialog)
  const { data: allTrendingData } = useQuery({
    queryKey: ["all-trending-keywords"],
    queryFn: () => keywordAnalysisAPI.getTrending({ limit: 50 }),
    enabled: isTrendingDialogOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user history
  const { data: historyData } = useQuery({
    queryKey: ["keyword-history"],
    queryFn: () => keywordAnalysisAPI.getHistory({ limit: 5 }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleKeywordClickInDialog = (keyword: string) => {
    onKeywordClick(keyword);
    setIsTrendingDialogOpen(false);
  };

  const getTrendingIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const getTrendingBadgeColor = (index: number) => {
    if (index < 3)
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (index < 10)
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Trending Keywords */}
      <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              Trending Keywords
            </CardTitle>
            <Dialog
              open={isTrendingDialogOpen}
              onOpenChange={setIsTrendingDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">View All</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-xl">
                    <BarChart3 className="mr-2 h-6 w-6 text-emerald-600" />
                    All Trending Keywords
                  </DialogTitle>
                  <DialogDescription>
                    Discover what's trending across the platform. Click any
                    keyword to analyze it.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  {allTrendingData?.success &&
                  allTrendingData.data.trending.length > 0 ? (
                    <div className="space-y-3">
                      {allTrendingData.data.trending.map((item, index) => (
                        <div
                          key={index}
                          className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() =>
                            handleKeywordClickInDialog(item.keyword)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div
                                className={`px-2 py-1 rounded-full text-sm font-bold ${getTrendingBadgeColor(
                                  index
                                )}`}
                              >
                                {getTrendingIcon(index)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">
                                  {item.keyword}
                                </h4>
                                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Search className="h-3 w-3 mr-1" />
                                    {item.totalSearches} searches
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(
                                      item.lastSearched
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-emerald-600 border-emerald-200 group-hover:bg-emerald-50"
                            >
                              Analyze
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        No trending keywords available
                      </p>
                      <p className="text-gray-400 mt-2">
                        Be the first to start analyzing keywords!
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {trendingData?.success && trendingData.data.trending.length > 0 ? (
            <div className="space-y-2">
              {trendingData.data.trending.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors group"
                  onClick={() => onKeywordClick(item.keyword)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="text-xs font-bold text-emerald-600">
                        {getTrendingIcon(index)}
                      </span>
                      <span className="font-medium text-gray-800 group-hover:text-emerald-600 flex-1 truncate">
                        {item.keyword}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs ml-2 flex-shrink-0"
                    >
                      {item.totalSearches} searches
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    Last searched:{" "}
                    {new Date(item.lastSearched).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {/* Show All Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => setIsTrendingDialogOpen(true)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Trending Keywords
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No trending keywords available yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Start analyzing keywords to see trends
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Analysis History */}
      {user?.id && (
        <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-xl">
            <CardTitle className="flex items-center text-lg">
              <History className="mr-2 h-5 w-5" />
              Recent Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {historyData?.success && historyData.data.analyses.length > 0 ? (
              <div className="space-y-2">
                {historyData.data.analyses.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                    onClick={() => onKeywordClick(item.keyword)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 group-hover:text-blue-600 block truncate">
                          {item.keyword}
                        </span>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          <span>{item.searchCount} searches</span>
                          <span>•</span>
                          <span>
                            {new Date(item.lastAnalyzed).toLocaleDateString()}
                          </span>
                        </div>
                        {item.insights && (
                          <div className="mt-2 text-xs">
                            <span className="text-gray-500">
                              {keywordAnalysisUtils.getInsightsSummary(
                                item.insights
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.insights && (
                        <Badge
                          variant="outline"
                          className={`text-xs ml-2 flex-shrink-0 ${keywordAnalysisUtils.getOpportunityColor(
                            item.insights.contentOpportunity
                          )} border-0`}
                        >
                          {item.insights.contentOpportunity}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No analysis history yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your analyzed keywords will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-xl">
          <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-medium text-amber-800 mb-1">Best Practices</p>
              <ul className="text-amber-700 space-y-1 text-xs">
                <li>• Use specific, long-tail keywords</li>
                <li>• Check competition vs. opportunity</li>
                <li>• Look for trending topics</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800 mb-1">Interpretation</p>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• Low competition = easier to rank</li>
                <li>• High opportunity = good potential</li>
                <li>• Trending up = growing interest</li>
              </ul>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-medium text-green-800 mb-1">Next Steps</p>
              <ul className="text-green-700 space-y-1 text-xs">
                <li>• Use insights for content planning</li>
                <li>• Monitor competitor strategies</li>
                <li>• Track keyword performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeywordAnalysisSidebar;
