// Updated KeywordAnalysisMain.tsx - Enhanced keyword selection handling
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  History,
  Loader2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/authStore";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  keywordAnalysisAPI,
  keywordAnalysisUtils,
  type KeywordAnalysisData,
} from "@/api/keywordAnalysisApi";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import KeywordAnalysisResults from "./KeywordAnalysisResults";
import { useNavigate } from "react-router-dom";

interface KeywordAnalysisMainProps {
  onViewDetails: (analysisId: string) => void;
  selectedKeyword?: string;
  onKeywordChange?: (keyword: string) => void;
}

const KeywordAnalysisMain = ({
  onViewDetails,
  selectedKeyword,
  onKeywordChange,
}: KeywordAnalysisMainProps) => {
  const { user } = useAuthStore();
  const navigate= useNavigate();
  const queryClient = useQueryClient();
  const hasCredits = user?.creditBalance ? user.creditBalance > 0 : false;

  // Local state
  const [keyword, setKeyword] = useState("");
  const [analysisData, setAnalysisData] = useState<KeywordAnalysisData | null>(
    null
  );
  const [showHistory, setShowHistory] = useState(false);

  // Enhanced effect to handle keyword selection from sidebar
  useEffect(() => {
    if (selectedKeyword && selectedKeyword !== keyword) {
      setKeyword(selectedKeyword);
      // Scroll to top to make the form visible
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Show success toast to confirm selection
      toast.success(`Selected keyword: "${selectedKeyword}"`);

      // Focus the input field after a short delay
      setTimeout(() => {
        const inputElement = document.getElementById("keyword");
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
    }
  }, [selectedKeyword, keyword]);

  // Fetch user history for the dropdown
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["keyword-history"],
    queryFn: () => keywordAnalysisAPI.getHistory({ limit: 10 }),
    enabled: !!user?.id && showHistory,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Keyword analysis mutation
  const analyzeKeywordMutation = useMutation({
    mutationFn: keywordAnalysisAPI.analyzeKeyword,
    onSuccess: (data) => {
      if (data.success) {
        setAnalysisData(data.data);
        toast.success("Keyword analysis completed!");
        // Invalidate history to refresh it
        queryClient.invalidateQueries({ queryKey: ["keyword-history"] });
        // Invalidate trending keywords to update counts
        queryClient.invalidateQueries({ queryKey: ["trending-keywords"] });
        queryClient.invalidateQueries({ queryKey: ["all-trending-keywords"] });
      } else {
        toast.error(data.error || "Analysis failed");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to analyze keyword");
    },
  });

  const handleAnalyze = async () => {
    const validation = keywordAnalysisUtils.validateKeyword(keyword);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid keyword");
      return;
    }

    if (!hasCredits) {
      toast.error(
        "You have no credits left. Please purchase more to analyze keywords."
      );
      return;
    }

    // Reset state
    setAnalysisData(null);

    try {
      await analyzeKeywordMutation.mutateAsync({ keyword: keyword.trim() });
    } catch (error) {
      console.error("Error analyzing keyword:", error);
    } finally {
      // Refresh user data to update credit balance
      useAuthStore.getState().refreshUser();
    }
  };

  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword);
    // Notify parent component of the change
    if (onKeywordChange) {
      onKeywordChange(newKeyword);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !analyzeKeywordMutation.isPending &&
      keyword.trim() &&
      hasCredits
    ) {
      handleAnalyze();
    }
  };

  const handleViewDetailedAnalysis = () => {
    if (analysisData?.analysisId) {
      onViewDetails(analysisData.analysisId);
    } else {
      toast.error("No detailed analysis available");
    }
  };

  const handleHistoryItemClick = (historyKeyword: string) => {
    handleKeywordChange(historyKeyword);
    setShowHistory(false);
    // Show a subtle indicator that the keyword was selected
    toast.success(`Selected: "${historyKeyword}"`);
  };

  const handleToggleHistory = () => {
    setShowHistory((prev) => !prev);
  };

  const handleBuyCredits = () => {
    navigate("/packages");
  };

  // Show error from analysis mutation
  const error = analyzeKeywordMutation.error?.message;

  return (
    <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-800 to-teal-900 text-white">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center text-2xl font-bold">
            <Search className="mr-2 h-6 w-6 text-yellow-300" />
            YouTube Keyword Analysis
          </CardTitle>
          {user?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleHistory}
              className="text-white hover:bg-white/20 flex items-center"
            >
              <History className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">History</span>
              {showHistory ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
          )}
        </div>
        <p className="text-center text-white/90 text-sm">
          Analyze competition, trends, and opportunities for any YouTube keyword
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <Label
            htmlFor="keyword"
            className="text-sm font-medium text-gray-700"
          >
            Enter keyword to analyze
          </Label>
          <div className="relative">
            <Input
              id="keyword"
              placeholder="e.g., how to make youtube videos, react tutorial, fitness workout"
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              onKeyUp={handleKeyPress}
              className={`border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg transition-all ${
                !hasCredits ? "opacity-75" : ""
              }`}
              disabled={!hasCredits}
            />
          </div>

          {/* Credits Indicator */}
          {!hasCredits && user?.id && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 rounded-full p-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-amber-800 text-sm font-medium">
                    No Credits Available
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    You need credits to perform keyword analysis. Purchase
                    credits to continue.
                  </p>
                  <Button
                    onClick={handleBuyCredits}
                    size="sm"
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5"
                  >
                    Buy Credits
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Low Credits Warning */}
          {hasCredits &&
            user?.creditBalance &&
            user.creditBalance <= 5 &&
            user.creditBalance > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 rounded-full p-1.5">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-800 text-sm font-medium">
                      Low Credits Warning
                    </p>
                    <p className="text-orange-700 text-xs mt-1">
                      You have {user.creditBalance} credits remaining. Consider
                      purchasing more to avoid interruption.
                    </p>
                    <Button
                      onClick={handleBuyCredits}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100 text-xs px-3 py-1.5"
                    >
                      Buy More Credits
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
        </div>

        {/* History Dropdown */}
        <AnimatePresence>
          {showHistory && user?.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    Recent Analysis History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-500">
                        Loading history...
                      </span>
                    </div>
                  ) : historyData?.success &&
                    historyData.data.analyses.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {historyData.data.analyses.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-all duration-200 hover:shadow-md group"
                          onClick={() => handleHistoryItemClick(item.keyword)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800 group-hover:text-purple-600 block truncate">
                                {item.keyword}
                              </span>
                              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                <span>{item.searchCount} searches</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(
                                    item.lastAnalyzed
                                  ).toLocaleDateString()}
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
                    <div className="text-center py-4">
                      <History className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        No analysis history yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Your analyzed keywords will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleAnalyze}
          disabled={
            analyzeKeywordMutation.isPending || !keyword.trim() || !hasCredits
          }
          className={`w-full font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center ${
            hasCredits
              ? "bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {analyzeKeywordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : !hasCredits ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              No Credits Available
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Analyze Keyword
            </>
          )}
        </Button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start"
          >
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </CardContent>

      {/* Analysis Results */}
      {analysisData && (
        <CardContent className="pt-0">
          <KeywordAnalysisResults
            analysisData={analysisData}
            onViewDetails={handleViewDetailedAnalysis}
          />
        </CardContent>
      )}

      <CardFooter className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 px-6 py-3">
        <div className="flex items-center space-x-4">
          <span>
            Available Credits:{" "}
            <span
              className={`font-medium ${
                !hasCredits
                  ? "text-red-600"
                  : user?.creditBalance && user.creditBalance <= 5
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              {user?.creditBalance || 0}
            </span>
          </span>
          {!hasCredits && (
            <Button
              onClick={handleBuyCredits}
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-6 border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              Buy Credits
            </Button>
          )}
        </div>
        <div>Cost: 1 credit per analysis</div>
      </CardFooter>
    </Card>
  );
};

export default KeywordAnalysisMain;
