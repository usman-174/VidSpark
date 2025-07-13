// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Loader2 } from "lucide-react";
// import axiosInstance from "@/api/axiosInstance";
// import { useQueryClient } from "@tanstack/react-query";

// const formatNumber = (num: number): string => {
//   if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
//   if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
//   return num.toString();
// };

// // Types
// interface PopularKeyword {
//   term: string;
//   usageCount: number;
// }

// interface VideoData {
//   videoId: string;
//   videoTitle?: string;
//   title?: string;
//   channelTitle?: string;
//   viewCount?: number;
//   subscriberCount?: number;
// }

// interface AnalyzeResponse {
//   suggestions: string[];
//   topVideos: VideoData[];
//   opportunityScore: number;
//   relatedKeywords: string[];
//   questions: string[];
//   contentGaps: string[];
//   insights: string[];
// }

// const KeywordAnalysis = () => {
//   const queryClient = useQueryClient();

//   const [keyword, setKeyword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [suggestions, setSuggestions] = useState<string[]>([]);
//   const [competingVideos, setCompetingVideos] = useState<VideoData[]>([]);
//   const [opportunityScore, setOpportunityScore] = useState<number | null>(null);
//   const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
//   const [questions, setQuestions] = useState<string[]>([]);
//   const [contentGaps, setContentGaps] = useState<string[]>([]);
//   const [insights, setInsights] = useState<string[]>([]);
//   const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([]);
//   const [loadingPopularKeywords, setLoadingPopularKeywords] = useState(true);

//   // New filter state for popular keywords
//   const [filter, setFilter] = useState<"week" | "month" | null>(null);

//   useEffect(() => {
//     fetchPopularKeywords(filter);
//   }, [filter]);

//   const fetchPopularKeywords = async (
//     filterParam?: "week" | "month" | null
//   ) => {
//     try {
//       setLoadingPopularKeywords(true);
//       const url = filterParam
//         ? `/keywords/popular?filter=${filterParam}`
//         : "/keywords/popular";
//       const res = await axiosInstance.get<PopularKeyword[]>(url);
//       setPopularKeywords(Array.isArray(res.data) ? res.data : []);
//     } catch (error) {
//       console.error("Failed to fetch popular keywords:", error);
//       setPopularKeywords([]);
//     } finally {
//       setLoadingPopularKeywords(false);
//     }
//   };

//   const handleAnalyze = async (inputKeyword?: string) => {
//     const searchKeyword = inputKeyword ?? keyword;
//     if (!searchKeyword.trim()) return;

//     setLoading(true);
//     try {
//       const res = await axiosInstance.post<AnalyzeResponse>(
//         "/keywords/analyze",
//         {
//           keyword: searchKeyword,
//         }
//       );

//       const data = res.data;
//       setKeyword(searchKeyword);
//       setSuggestions(data.suggestions || []);
//       setCompetingVideos(data.topVideos || []);
//       setOpportunityScore(
//         typeof data.opportunityScore === "number" ? data.opportunityScore : null
//       );
//       setRelatedKeywords(data.relatedKeywords || []);
//       setQuestions(data.questions || []);
//       setContentGaps(data.contentGaps || []);
//       setInsights(data.insights || []);

//       // Refresh popular keywords on analyze but keep current filter
//       fetchPopularKeywords(filter);
//       queryClient.invalidateQueries({ queryKey: ["insights", "dashboard"] });
//     } catch (error) {
//       console.error("Error analyzing keyword:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex max-w-7xl mx-auto py-10 px-4 gap-6">
//       <aside className="w-full md:w-[240px] bg-white shadow rounded-lg border p-4">
//         <div className="flex flex-col gap-3 mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">
//             🔥 Top Search Keywords
//           </h3>

//           {/* Filter Buttons */}
//           <div className="flex gap-2">
//             {["All", "Week", "Month"].map((label) => {
//               const key =
//                 label.toLowerCase() === "all" ? null : label.toLowerCase();
//               const isActive = filter === key;

//               return (
//                 <button
//                   key={label}
//                   onClick={() => setFilter(key as "week" | "month" | null)}
//                   className={`px-3 py-1 text-xs rounded-full font-medium transition-all border ${
//                     isActive
//                       ? "bg-amber-500 text-white border-amber-500"
//                       : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
//                   }`}
//                 >
//                   {label}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {loadingPopularKeywords ? (
//           <p className="text-sm text-gray-500">Loading popular keywords...</p>
//         ) : (
//           <ScrollArea className="h-[300px] pr-1">
//             <ul className="space-y-2">
//               {popularKeywords.length > 0 ? (
//                 popularKeywords.map((kw, i) => (
//                   <li
//                     key={i}
//                     onClick={() => handleAnalyze(kw.term)}
//                     className="cursor-pointer p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-all flex justify-between items-center text-sm"
//                     title={`Analyze "${kw.term}"`}
//                   >
//                     <span className="font-medium text-gray-800">{kw.term}</span>
//                     <span className="text-gray-500">
//                       {formatNumber(kw.usageCount)}
//                     </span>
//                   </li>
//                 ))
//               ) : (
//                 <li className="text-gray-500 text-sm">
//                   No popular keywords found
//                 </li>
//               )}
//             </ul>
//           </ScrollArea>
//         )}
//       </aside>

//       {/* Main */}
//       <main className="flex-1">
//         <Card>
//           <CardHeader>
//             <CardTitle>Keyword Explorer</CardTitle>
//             <CardDescription>
//               Enter a keyword to discover opportunities, competition, and ideas.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <Input
//               value={keyword}
//               onChange={(e) => setKeyword(e.target.value)}
//               placeholder="e.g. AI tools for students"
//               onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
//             />
//             <Button onClick={() => handleAnalyze()} disabled={loading}>
//               {loading && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
//               Analyze
//             </Button>

//             {opportunityScore !== null && (
//               <div className="pt-4">
//                 <h3 className="font-semibold mb-2">Opportunity Score:</h3>
//                 <Badge variant="secondary" className="text-lg">
//                   {opportunityScore}/100
//                 </Badge>
//               </div>
//             )}

//             {suggestions.length > 0 && (
//               <div>
//                 <h3 className="font-semibold mb-2">Search Suggestions:</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {suggestions.map((s, i) => (
//                     <Badge
//                       key={i}
//                       className="bg-black text-white hover:bg-gray-800"
//                     >
//                       {s}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {competingVideos.length > 0 && (
//               <div>
//                 <h3 className="font-semibold mb-2">Top Competing Videos:</h3>
//                 <ul className="space-y-2 max-h-64 overflow-y-auto">
//                   {competingVideos.map((video, i) => (
//                     <li key={i} className="border p-2 rounded">
//                       <a
//                         href={`https://www.youtube.com/watch?v=${video.videoId}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="font-medium text-blue-600 hover:underline"
//                       >
//                         {video.videoTitle || video.title || "Untitled"}
//                       </a>
//                       <p className="text-sm text-gray-600">
//                         Channel: {video.channelTitle || "Unknown"}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         Views:{" "}
//                         {video.viewCount
//                           ? formatNumber(video.viewCount)
//                           : "N/A"}
//                       </p>
//                       <p className="text-sm text-gray-600">
//                         Subscribers:{" "}
//                         {video.subscriberCount
//                           ? formatNumber(video.subscriberCount)
//                           : "N/A"}
//                       </p>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
//               <div>
//                 <h3 className="font-semibold mb-2">Related Keywords</h3>
//                 <ScrollArea className="h-40">
//                   {relatedKeywords.length > 0 ? (
//                     relatedKeywords.map((kw, i) => (
//                       <Badge key={i} className="mr-2 mb-2" variant="secondary">
//                         {kw}
//                       </Badge>
//                     ))
//                   ) : (
//                     <p className="text-gray-500">No related keywords found</p>
//                   )}
//                 </ScrollArea>
//               </div>
//               <div>
//                 <h3 className="font-semibold mb-2">Questions People Ask</h3>
//                 {questions.length > 0 ? (
//                   <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
//                     {questions.map((q, i) => (
//                       <li key={i}>{q}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="text-gray-500">No questions found</p>
//                 )}
//               </div>
//             </div>

//             {contentGaps.length > 0 && (
//               <div className="pt-4">
//                 <h3 className="font-semibold mb-2">Content Gaps</h3>
//                 <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
//                   {contentGaps.map((gap, i) => (
//                     <li key={i}>{gap}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {insights.length > 0 && (
//               <div className="pt-4">
//                 <h3 className="font-semibold mb-2">LLM-Generated Insights</h3>
//                 <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
//                   {insights.map((insight, i) => (
//                     <li key={i}>{insight}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// };

// export default KeywordAnalysis;

// import {
//   keywordAnalysisAPI,
//   keywordAnalysisUtils,
//   type KeywordAnalysisData,
// } from "@/api/keywordAnalysisApi";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Progress } from "@/components/ui/progress";
// import useAuthStore from "@/store/authStore";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { motion } from "framer-motion";
// import {
//   AlertCircle,
//   BarChart3,
//   Calendar,
//   Check,
//   Clock,
//   Copy,
//   Eye,
//   History,
//   Lightbulb,
//   Loader2,
//   Search,
//   Target,
//   TrendingUp,
//   Trophy,
//   Users
// } from "lucide-react";
// import { useState } from "react";
// import { toast } from "react-hot-toast";

// const KeywordAnalysis = () => {
//   const { user } = useAuthStore();
//   const queryClient = useQueryClient();

//   // Local state
//   const [keyword, setKeyword] = useState("");
//   const [analysisData, setAnalysisData] = useState<KeywordAnalysisData | null>(
//     null
//   );
//   const [copiedVideoIndex, setCopiedVideoIndex] = useState<number | null>(null);
//   const [showHistory, setShowHistory] = useState(false);

//   // Keyword analysis mutation
//   const analyzeKeywordMutation = useMutation({
//     mutationFn: keywordAnalysisAPI.analyzeKeyword,
//     onSuccess: (data) => {
//       if (data.success) {
//         setAnalysisData(data.data);
//         toast.success("Keyword analysis completed!");
//         // Invalidate history to refresh it
//         queryClient.invalidateQueries({ queryKey: ["keyword-history"] });
//       } else {
//         toast.error(data.error || "Analysis failed");
//       }
//     },
//     onError: (error: any) => {
//       toast.error(error.message || "Failed to analyze keyword");
//     },
//   });

//   // Fetch trending keywords
//   const { data: trendingData } = useQuery({
//     queryKey: ["trending-keywords"],
//     queryFn: () => keywordAnalysisAPI.getTrending({ limit: 5 }),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });

//   // Fetch user history
//   const { data: historyData } = useQuery({
//     queryKey: ["keyword-history"],
//     queryFn: () => keywordAnalysisAPI.getHistory({ limit: 5 }),
//     enabled: !!user?.id,
//     staleTime: 2 * 60 * 1000, // 2 minutes
//   });

//   const handleAnalyze = async () => {
//     const validation = keywordAnalysisUtils.validateKeyword(keyword);
//     if (!validation.isValid) {
//       toast.error(validation.error || "Invalid keyword");
//       return;
//     }

//     if (user?.creditBalance === 0) {
//       toast.error(
//         "You have no credits left. Please purchase more to analyze keywords."
//       );
//       return;
//     }

//     // Reset state
//     setAnalysisData(null);

//     try {
//       await analyzeKeywordMutation.mutateAsync({ keyword: keyword.trim() });
//     } catch (error) {
//       console.error("Error analyzing keyword:", error);
//     }
//   };

//   const handleCopyVideoTitle = (title: string, index: number) => {
//     navigator.clipboard.writeText(title);
//     setCopiedVideoIndex(index);
//     setTimeout(() => setCopiedVideoIndex(null), 2000);
//     toast.success("Video title copied to clipboard!");
//   };

//   const handleKeyPress = (e: any) => {
//     if (
//       e.key === "Enter" &&
//       !analyzeKeywordMutation.isPending &&
//       keyword.trim()
//     ) {
//       handleAnalyze();
//     }
//   };

//   const handleTrendingClick = (trendingKeyword: string) => {
//     setKeyword(trendingKeyword);
//   };

//   const handleHistoryClick = (historyKeyword: string) => {
//     setKeyword(historyKeyword);
//   };

//   // Render competition score with color
//   const renderCompetitionScore = (score: number) => {
//     const color = keywordAnalysisUtils.getCompetitionColor(score);
//     const text = keywordAnalysisUtils.formatCompetitionScore(score);

//     return (
//       <div className="flex items-center space-x-2">
//         <Progress value={score} className="flex-1 h-2" />
//         <span className={`text-sm font-medium ${color}`}>{text}</span>
//       </div>
//     );
//   };

//   // Render trend direction
//   const renderTrendDirection = (direction: "UP" | "DOWN" | "STABLE") => {
//     const icon = keywordAnalysisUtils.getTrendIcon(direction);
//     const colors = {
//       UP: "text-green-600 bg-green-50",
//       DOWN: "text-red-600 bg-red-50",
//       STABLE: "text-gray-600 bg-gray-50",
//     };

//     return (
//       <Badge className={`${colors[direction]} border-0`}>
//         {icon} {direction}
//       </Badge>
//     );
//   };

//   // Show error from analysis mutation
//   const error = analyzeKeywordMutation.error?.message;

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
//         {/* Main Analyzer Card - Takes up 3 columns */}
//         <div className="lg:col-span-3">
//           <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white overflow-hidden">
//             <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
//               <div className="flex justify-between items-start">
//                 <CardTitle className="flex items-center text-2xl font-bold">
//                   <Search className="mr-2 h-6 w-6 text-yellow-300" />
//                   YouTube Keyword Analysis
//                 </CardTitle>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => setShowHistory(!showHistory)}
//                   className="text-white hover:bg-white/20 flex items-center"
//                 >
//                   <History className="h-4 w-4 mr-1" />
//                   <span className="hidden sm:inline">History</span>
//                 </Button>
//               </div>
//               <p className="text-center text-white/90 text-sm">
//                 Analyze competition, trends, and opportunities for any YouTube
//                 keyword
//               </p>
//             </CardHeader>

//             <CardContent className="space-y-6 pt-6">
//               <div className="space-y-3">
//                 <Label
//                   htmlFor="keyword"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Enter keyword to analyze
//                 </Label>
//                 <Input
//                   id="keyword"
//                   placeholder="e.g., how to make youtube videos, react tutorial, fitness workout"
//                   value={keyword}
//                   onChange={(e) => setKeyword(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
//                 />
//               </div>

//               <Button
//                 onClick={handleAnalyze}
//                 disabled={analyzeKeywordMutation.isPending || !keyword.trim()}
//                 className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
//               >
//                 {analyzeKeywordMutation.isPending ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Analyzing...
//                   </>
//                 ) : (
//                   <>
//                     <Search className="mr-2 h-4 w-4" />
//                     Analyze Keyword
//                   </>
//                 )}
//               </Button>

//               {error && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start"
//                 >
//                   <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
//                   <span>{error}</span>
//                 </motion.div>
//               )}
//             </CardContent>

//             {/* Analysis Results */}
//             {analysisData && (
//               <CardContent className="pt-0">
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="space-y-6"
//                 >
//                   {/* Overview Cards */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
//                       <CardContent className="p-4">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-sm text-blue-600 font-medium">
//                               Competition Level
//                             </p>
//                             <div className="mt-2">
//                               {renderCompetitionScore(
//                                 analysisData.insights.competitionScore
//                               )}
//                             </div>
//                           </div>
//                           <BarChart3 className="h-8 w-8 text-blue-500" />
//                         </div>
//                       </CardContent>
//                     </Card>

//                     <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
//                       <CardContent className="p-4">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-sm text-green-600 font-medium">
//                               Content Opportunity
//                             </p>
//                             <div className="mt-2">
//                               <Badge
//                                 className={`${keywordAnalysisUtils.getOpportunityColor(
//                                   analysisData.insights.contentOpportunity
//                                 )} bg-transparent border-0 text-lg font-semibold p-0`}
//                               >
//                                 {analysisData.insights.contentOpportunity}
//                               </Badge>
//                             </div>
//                           </div>
//                           <Target className="h-8 w-8 text-green-500" />
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </div>

//                   {/* Key Metrics */}
//                   <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
//                     <CardHeader className="pb-4">
//                       <CardTitle className="text-purple-800 flex items-center">
//                         <TrendingUp className="h-5 w-5 mr-2" />
//                         Key Metrics
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                         <div className="text-center">
//                           <div className="flex items-center justify-center mb-2">
//                             <Eye className="h-5 w-5 text-purple-600 mr-2" />
//                             <span className="text-sm text-purple-600 font-medium">
//                               Average Views
//                             </span>
//                           </div>
//                           <p className="text-2xl font-bold text-gray-800">
//                             {keywordAnalysisUtils.formatViews(
//                               analysisData.insights.averageViews
//                             )}
//                           </p>
//                         </div>

//                         <div className="text-center">
//                           <div className="flex items-center justify-center mb-2">
//                             <Calendar className="h-5 w-5 text-purple-600 mr-2" />
//                             <span className="text-sm text-purple-600 font-medium">
//                               Recent Videos
//                             </span>
//                           </div>
//                           <p className="text-2xl font-bold text-gray-800">
//                             {analysisData.insights.recentVideoCount}
//                           </p>
//                           <p className="text-xs text-gray-500">Last 30 days</p>
//                         </div>

//                         <div className="text-center">
//                           <div className="flex items-center justify-center mb-2">
//                             <Clock className="h-5 w-5 text-purple-600 mr-2" />
//                             <span className="text-sm text-purple-600 font-medium">
//                               Trend
//                             </span>
//                           </div>
//                           <div className="flex justify-center">
//                             {renderTrendDirection(
//                               analysisData.insights.trendDirection
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* AI Insights */}
//                   <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
//                     <CardHeader className="pb-4">
//                       <CardTitle className="text-orange-800 flex items-center">
//                         <Lightbulb className="h-5 w-5 mr-2" />
//                         AI-Powered Insights
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-3">
//                         {analysisData.insights.aiInsights.map(
//                           (insight, index) => (
//                             <motion.div
//                               key={index}
//                               initial={{ opacity: 0, x: -10 }}
//                               animate={{ opacity: 1, x: 0 }}
//                               transition={{ delay: index * 0.1 }}
//                               className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-yellow-200"
//                             >
//                               <div className="bg-orange-100 rounded-full p-1.5 flex-shrink-0">
//                                 <span className="text-orange-600 font-bold text-sm">
//                                   {index + 1}
//                                 </span>
//                               </div>
//                               <p className="text-gray-700 text-sm">{insight}</p>
//                             </motion.div>
//                           )
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* Top Performing Videos */}
//                   <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
//                     <CardHeader className="pb-4">
//                       <CardTitle className="text-indigo-800 flex items-center">
//                         <Trophy className="h-5 w-5 mr-2" />
//                         Top Performing Videos
//                       </CardTitle>
//                       <p className="text-sm text-indigo-600">
//                         Click titles to copy
//                       </p>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-3 max-h-96 overflow-y-auto">
//                         {analysisData.videoAnalysis
//                           .slice(0, 10)
//                           .map((video, index) => (
//                             <motion.div
//                               key={video.videoId}
//                               initial={{ opacity: 0, y: 10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ delay: index * 0.05 }}
//                               className="group p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer"
//                               onClick={() =>
//                                 handleCopyVideoTitle(video.title, index)
//                               }
//                             >
//                               <div className="flex justify-between items-start">
//                                 <div className="flex-1 pr-4">
//                                   <h4 className="font-medium text-gray-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
//                                     {video.title}
//                                   </h4>
//                                   <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
//                                     <span className="flex items-center">
//                                       <Eye className="h-3 w-3 mr-1" />
//                                       {keywordAnalysisUtils.formatViews(
//                                         video.views
//                                       )}
//                                     </span>
//                                     <span className="flex items-center">
//                                       <Users className="h-3 w-3 mr-1" />
//                                       {video.channelName}
//                                     </span>
//                                     <span className="flex items-center">
//                                       <Calendar className="h-3 w-3 mr-1" />
//                                       {keywordAnalysisUtils.getDaysSinceUpload(
//                                         video.uploadDate
//                                       )}
//                                       d ago
//                                     </span>
//                                   </div>
//                                 </div>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
//                                 >
//                                   {copiedVideoIndex === index ? (
//                                     <Check className="h-4 w-4" />
//                                   ) : (
//                                     <Copy className="h-4 w-4" />
//                                   )}
//                                 </Button>
//                               </div>
//                             </motion.div>
//                           ))}
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* Top Channels */}
//                   {analysisData.insights.topChannels.length > 0 && (
//                     <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
//                       <CardHeader className="pb-4">
//                         <CardTitle className="text-teal-800 flex items-center">
//                           <Users className="h-5 w-5 mr-2" />
//                           Top Competing Channels
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent>
//                         <div className="flex flex-wrap gap-2">
//                           {analysisData.insights.topChannels.map(
//                             (channel, index) => (
//                               <Badge
//                                 key={index}
//                                 variant="outline"
//                                 className="bg-white text-teal-700 border-teal-200 hover:bg-teal-100"
//                               >
//                                 {channel}
//                               </Badge>
//                             )
//                           )}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   )}
//                 </motion.div>
//               </CardContent>
//             )}

//             <CardFooter className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 px-6 py-3">
//               <div>
//                 Available Credits:{" "}
//                 <span className="font-medium">{user?.creditBalance || 0}</span>
//               </div>
//               <div>Cost: 1 credit per analysis</div>
//             </CardFooter>
//           </Card>
//         </div>

//         {/* Sidebar - Takes up 2 columns */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Trending Keywords */}
//           <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
//             <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-xl">
//               <CardTitle className="flex items-center text-lg">
//                 <TrendingUp className="mr-2 h-5 w-5" />
//                 Trending Keywords
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-4">
//               {trendingData?.success &&
//               trendingData.data.trending.length > 0 ? (
//                 <div className="space-y-2">
//                   {trendingData.data.trending.map((item, index) => (
//                     <div
//                       key={index}
//                       className="p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors group"
//                       onClick={() => handleTrendingClick(item.keyword)}
//                     >
//                       <div className="flex justify-between items-center">
//                         <span className="font-medium text-gray-800 group-hover:text-emerald-600">
//                           {item.keyword}
//                         </span>
//                         <Badge variant="outline" className="text-xs">
//                           {item.totalSearches} searches
//                         </Badge>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500 text-sm text-center py-4">
//                   No trending keywords available
//                 </p>
//               )}
//             </CardContent>
//           </Card>

//           {/* Recent Analysis History */}
//           {user?.id && (
//             <Card className="shadow-lg border border-gray-200 rounded-xl bg-white">
//               <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-xl">
//                 <CardTitle className="flex items-center text-lg">
//                   <History className="mr-2 h-5 w-5" />
//                   Recent Analysis
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="pt-4">
//                 {historyData?.success &&
//                 historyData.data.analyses.length > 0 ? (
//                   <div className="space-y-2">
//                     {historyData.data.analyses.map((item, index) => (
//                       <div
//                         key={item.id}
//                         className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
//                         onClick={() => handleHistoryClick(item.keyword)}
//                       >
//                         <div className="flex justify-between items-start">
//                           <div className="flex-1">
//                             <span className="font-medium text-gray-800 group-hover:text-blue-600">
//                               {item.keyword}
//                             </span>
//                             <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
//                               <span>{item.searchCount} searches</span>
//                               <span>•</span>
//                               <span>
//                                 {new Date(
//                                   item.lastAnalyzed
//                                 ).toLocaleDateString()}
//                               </span>
//                             </div>
//                           </div>
//                           {item.insights && (
//                             <Badge
//                               variant="outline"
//                               className={`text-xs ${keywordAnalysisUtils.getOpportunityColor(
//                                 item.insights.contentOpportunity
//                               )} border-0`}
//                             >
//                               {item.insights.contentOpportunity}
//                             </Badge>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-gray-500 text-sm text-center py-4">
//                     No analysis history yet
//                   </p>
//                 )}
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default KeywordAnalysis;
import KeywordAnalysisDetailsModal from "@/components/keywordAnalysis/KeywordAnalysisDetailsModal";
import KeywordAnalysisMain from "@/components/keywordAnalysis/KeywordAnalysisMain";
import KeywordAnalysisSidebar from "@/components/keywordAnalysis/KeywordAnalysisSidebar";
import { useState } from "react";

const KeywordAnalysis = () => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");

  const handleViewDetails = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAnalysisId(null);
  };

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword);
    // Scroll to top to make the form visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKeywordChange = (keyword: string) => {
    // Update selected keyword when user types or changes the input
    setSelectedKeyword(keyword);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Analyzer Card - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <KeywordAnalysisMain
              onViewDetails={handleViewDetails}
              selectedKeyword={selectedKeyword}
              onKeywordChange={handleKeywordChange}
            />
          </div>

          {/* Sidebar - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <KeywordAnalysisSidebar onKeywordClick={handleKeywordSelect} />
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <KeywordAnalysisDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        analysisId={selectedAnalysisId}
      />
    </>
  );
};

export default KeywordAnalysis;
