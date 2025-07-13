import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Target,
  TrendingUp,
  Eye,
  Calendar,
  Clock,
  Users,
  Trophy,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Download,
  Share2,
  History,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import {
  keywordAnalysisAPI,
  keywordAnalysisUtils,
} from "@/api/keywordAnalysisApi";

interface KeywordAnalysisDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string | null;
}

const KeywordAnalysisDetailsModal = ({
  isOpen,
  onClose,
  analysisId,
}: KeywordAnalysisDetailsModalProps) => {
  const [copiedVideoIndex, setCopiedVideoIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch detailed analysis data
  const {
    data: detailsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["keyword-analysis-details", analysisId],
    queryFn: () => keywordAnalysisAPI.getAnalysisDetails(analysisId!),
    enabled: !!analysisId && isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const analysis = detailsData?.data?.analysis;
  const latestInsights = analysis?.insights?.[0]; // Most recent insights

  const handleCopyVideoTitle = (title: string, index: number) => {
    navigator.clipboard.writeText(title);
    setCopiedVideoIndex(index);
    setTimeout(() => setCopiedVideoIndex(null), 2000);
    toast.success("Video title copied to clipboard!");
  };

  const handleCopyAllTitles = () => {
    if (analysis?.videoAnalysis) {
      const titles = analysis.videoAnalysis
        .map((video, index) => `${index + 1}. ${video.title}`)
        .join('\n');
      navigator.clipboard.writeText(titles);
      toast.success("All video titles copied to clipboard!");
    }
  };

  const handleShareAnalysis = () => {
    if (analysis) {
      const shareText = `Keyword Analysis: "${analysis.keyword}"\n\nCompetition: ${keywordAnalysisUtils.formatCompetitionScore(
        latestInsights?.competitionScore || 0
      )}\nOpportunity: ${latestInsights?.contentOpportunity || 'N/A'}\nAverage Views: ${keywordAnalysisUtils.formatViews(
        latestInsights?.averageViews || 0
      )}`;
      
      navigator.clipboard.writeText(shareText);
      toast.success("Analysis summary copied to clipboard!");
    }
  };

  // Render competition score with color
  const renderCompetitionScore = (score: number) => {
    const color = keywordAnalysisUtils.getCompetitionColor(score);
    const text = keywordAnalysisUtils.formatCompetitionScore(score);

    return (
      <div className="flex items-center space-x-2">
        <Progress value={score} className="flex-1 h-3" />
        <span className={`text-sm font-medium ${color}`}>{text}</span>
        <span className="text-xs text-gray-500">({score}/100)</span>
      </div>
    );
  };

  // Render trend direction
  const renderTrendDirection = (direction: "UP" | "DOWN" | "STABLE") => {
    const icon = keywordAnalysisUtils.getTrendIcon(direction);
    const colors = {
      UP: "text-green-600 bg-green-50",
      DOWN: "text-red-600 bg-red-50",
      STABLE: "text-gray-600 bg-gray-50",
    };

    return (
      <Badge className={`${colors[direction]} border-0`}>
        {icon} {direction}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">
                {isLoading ? "Loading Analysis..." : `Detailed Analysis: "${analysis?.keyword}"`}
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-1">
                {analysis && (
                  <>
                    Analyzed {analysis.searchCount} times • Last updated: {new Date(analysis.lastUpdated).toLocaleString()}
                  </>
                )}
              </DialogDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareAnalysis}
                className="text-white hover:bg-white/20"
                disabled={!analysis}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAllTitles}
                className="text-white hover:bg-white/20"
                disabled={!analysis}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                <p className="text-gray-600">Loading detailed analysis...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <p className="text-gray-600">Failed to load analysis details</p>
                <Button onClick={() => window.location.reload()} className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          ) : !analysis ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Analysis not found</p>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="videos">Videos ({analysis.videoAnalysis.length})</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="history">History ({analysis.insights.length})</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden px-6 pb-6">
                <TabsContent value="overview" className="h-full mt-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-6 pr-4">
                      {/* Current Insights Overview */}
                      {latestInsights && (
                        <>
                          {/* Key Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm text-blue-600 font-medium">Competition</p>
                                    <div className="mt-2">
                                      {renderCompetitionScore(latestInsights.competitionScore)}
                                    </div>
                                  </div>
                                  <BarChart3 className="h-6 w-6 text-blue-500" />
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-green-600 font-medium">Opportunity</p>
                                    <div className="mt-2">
                                      <Badge className={`${keywordAnalysisUtils.getOpportunityColor(latestInsights.contentOpportunity)} bg-transparent border-0 text-lg font-semibold p-0`}>
                                        {latestInsights.contentOpportunity}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Target className="h-6 w-6 text-green-500" />
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-purple-600 font-medium">Avg Views</p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">
                                      {keywordAnalysisUtils.formatViews(latestInsights.averageViews)}
                                    </p>
                                  </div>
                                  <Eye className="h-6 w-6 text-purple-500" />
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-amber-600 font-medium">Trend</p>
                                    <div className="mt-2">
                                      {renderTrendDirection(latestInsights.trendDirection)}
                                    </div>
                                  </div>
                                  <TrendingUp className="h-6 w-6 text-amber-500" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Additional Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center">
                                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                                  Recent Activity
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Videos (Last 30 days)</span>
                                    <span className="font-semibold">{latestInsights.recentVideoCount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Videos Analyzed</span>
                                    <span className="font-semibold">{analysis.videoAnalysis.length}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Analysis Count</span>
                                    <span className="font-semibold">{analysis.searchCount}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center">
                                  <Users className="h-5 w-5 mr-2 text-green-500" />
                                  Top Channels
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {latestInsights.topChannels.slice(0, 5).map((channel, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-800 truncate flex-1">{channel}</span>
                                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="videos" className="h-full mt-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-3 pr-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">All Videos ({analysis.videoAnalysis.length})</h3>
                        <Button
                          onClick={handleCopyAllTitles}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Copy All Titles</span>
                        </Button>
                      </div>
                      
                      {analysis.videoAnalysis.map((video, index) => (
                        <motion.div
                          key={video.videoId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer"
                          onClick={() => handleCopyVideoTitle(video.title, index)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-4">
                              <h4 className="font-medium text-gray-800 text-sm mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {video.title}
                              </h4>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {keywordAnalysisUtils.formatViews(video.views)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {video.channelName}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {keywordAnalysisUtils.getDaysSinceUpload(video.uploadDate)}d ago
                                </span>
                              </div>
                              {video.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {video.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {video.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{video.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedVideoIndex === index ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="insights" className="h-full mt-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-6 pr-4">
                      {latestInsights?.aiInsights && (
                        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-orange-800 flex items-center">
                              <Trophy className="h-5 w-5 mr-2" />
                              AI-Powered Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {latestInsights.aiInsights.map((insight, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-yellow-200 shadow-sm"
                                >
                                  <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                                    <span className="text-orange-600 font-bold text-sm">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{insight}</p>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="h-full mt-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                      <h3 className="font-semibold text-gray-800">Analysis History ({analysis.insights.length})</h3>
                      
                      {analysis.insights.map((insight, index) => (
                        <Card key={insight.id} className="border-l-4 border-l-purple-500">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm flex items-center">
                                <History className="h-4 w-4 mr-2 text-purple-500" />
                                Analysis #{analysis.insights.length - index}
                              </CardTitle>
                              <span className="text-xs text-gray-500">
                                {new Date(insight.analysisDate).toLocaleString()}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Competition</p>
                                <p className="font-semibold">{insight.competitionScore}/100</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Avg Views</p>
                                <p className="font-semibold">{keywordAnalysisUtils.formatViews(insight.averageViews)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Opportunity</p>
                                <Badge className={`${keywordAnalysisUtils.getOpportunityColor(insight.contentOpportunity)} bg-transparent border-0 text-xs p-0`}>
                                  {insight.contentOpportunity}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-gray-600">Trend</p>
                                {renderTrendDirection(insight.trendDirection)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeywordAnalysisDetailsModal;