import { PredictionRequest } from "@/api/evaluationApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAnalyzeContent, useEvaluationHealth } from "@/hooks/useEvaluation";
import useAuthStore from "@/store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Eye,
  Info,
  Loader2,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";

const ContentEvaluation = () => {
  const { user } = useAuthStore();

  // React Query hooks
  const analyzeContentMutation = useAnalyzeContent();
  const { data: healthStatus } = useEvaluationHealth();

  // Form state
  const [formData, setFormData] = useState<PredictionRequest>({
    title: "",
    description: "",
    tags_cleaned: "",
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save form to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("content-evaluation-form");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("content-evaluation-form", JSON.stringify(formData));
  }, [formData]);

  // Simplified validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title should be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description should be at least 20 characters";
    }

    if (!formData.tags_cleaned.trim()) {
      newErrors.tags_cleaned = "Tags are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PredictionRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAnalyze = async () => {
    if (!validateForm()) return;

    if (user?.creditBalance === 0) {
      setErrors({ general: "Insufficient credits to analyze content." });
      return;
    }

    try {
      await analyzeContentMutation.mutateAsync(formData);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleClearForm = () => {
    setFormData({ title: "", description: "", tags_cleaned: "" });
    setErrors({});
    localStorage.removeItem("content-evaluation-form");
  };

  // Quick fill with sample data
  const handleSampleData = () => {
    setFormData({
      title: "5 Secrets to Viral TikTok Content That Got Me 10M Views in 2024",
      description:
        "In this video, I'll reveal the exact strategies I used to create viral TikTok content that generated over 10 million views in just 6 months. You'll learn the 5 secret techniques that top creators use but never talk about publicly. From trending hashtags to optimal posting times, I'll show you everything you need to know to blow up on TikTok.",
      tags_cleaned:
        "viral content, tiktok tips, social media marketing, content creation, viral videos, tiktok algorithm, social media growth, content strategy",
    });
    setErrors({});
  };

  // Get analysis result
  const analysisResult = analyzeContentMutation.data;

  // Helper functions
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getPerformanceCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "viral":
      case "excellent":
        return <Award className="h-4 w-4 text-purple-500" />;
      case "high":
      case "good":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "medium":
      case "average":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getViralPotentialColor = (potential: string) => {
    switch (potential.toLowerCase()) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Safe accessor functions to prevent crashes
  const safeGetContentAnalysis = () => {
    return analysisResult?.data?.insights?.content_analysis || null;
  };

  const safeGetPerformanceMetrics = () => {
    return analysisResult?.data?.insights?.performance_metrics || null;
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Simplified Input Form */}
        <div className="w-full">
          <Card className="shadow-lg border-2 border-blue-100">
            <CardHeader className=" bg-gradient-to-b from-teal-800 to-teal-900 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="mr-2 h-6 w-6" />
                Content Analyzer
              </CardTitle>
              <p className="text-blue-100 text-sm">
                Get AI-powered view predictions and optimization insights
              </p>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Video Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Enter your video title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter your video description..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={`${
                    errors.description ? "border-red-500" : ""
                  } min-h-[100px]`}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma-separated) *
                </Label>
                <Input
                  id="tags"
                  placeholder="tag1, tag2, tag3..."
                  value={formData.tags_cleaned}
                  onChange={(e) =>
                    handleInputChange("tags_cleaned", e.target.value)
                  }
                  className={errors.tags_cleaned ? "border-red-500" : ""}
                />
                {errors.tags_cleaned && (
                  <p className="text-xs text-red-500">{errors.tags_cleaned}</p>
                )}
                <p className="text-xs text-gray-500">
                  {
                    formData.tags_cleaned.split(",").filter((t) => t.trim())
                      .length
                  }{" "}
                  tags
                </p>
              </div>

              {/* Disclaimer */}
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-xs">
                  <strong>Disclaimer:</strong> AI predictions are estimates.
                  Actual performance may vary due to timing, trends, algorithm
                  changes, and other factors.
                </AlertDescription>
              </Alert>

              {/* General Error */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="bg-gray-50 px-6 py-4 rounded-b-lg">
              <div className="flex flex-col w-full space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Credits: <strong>{user?.creditBalance || 0}</strong>
                  </span>
                  <span>Cost: 1 credit</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSampleData}
                    disabled={analyzeContentMutation.isPending}
                  >
                    Sample Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearForm}
                    disabled={analyzeContentMutation.isPending}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={
                      analyzeContentMutation.isPending ||
                      !healthStatus?.success ||
                      !formData.title.trim() ||
                      !formData.description.trim() ||
                      !formData.tags_cleaned.trim()
                    }
                    className="flex-1  bg-gradient-to-b from-teal-800 to-teal-900 hover:bg-teal-700/50"
                  >
                    {analyzeContentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {analyzeContentMutation.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Analyzing Content
                      </h3>
                      <p className="text-sm text-gray-500">
                        This may take a few seconds...
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : analysisResult ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Results Disclaimer */}
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs">
                    <strong>Results Note:</strong> These are AI estimates -
                    actual performance may differ due to various factors.
                  </AlertDescription>
                </Alert>

                {/* Main Results Card */}
                <Card className="shadow-lg border-2 border-green-100">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="mr-2 h-6 w-6" />
                        Analysis Results
                      </div>
                      <Badge
                        className={`${getScoreBadgeColor(
                          analysisResult.data.content_score
                        )} border`}
                      >
                        Score: {analysisResult.data.content_score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Main Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisResult.data.prediction.formatted_views}
                        </div>
                        <div className="text-sm text-gray-600">
                          Predicted Views
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Confidence:{" "}
                          {analysisResult.data.prediction.confidence}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          {getPerformanceCategoryIcon(
                            safeGetPerformanceMetrics()?.performance_category ||
                              "unknown"
                          )}
                          <span className="ml-2 text-lg font-bold text-purple-600">
                            {safeGetPerformanceMetrics()
                              ?.performance_category || "Unknown"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Performance Category
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    {safeGetPerformanceMetrics() && (
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span
                              className={`font-bold ${getViralPotentialColor(
                                safeGetPerformanceMetrics()?.viral_potential ||
                                  "unknown"
                              )}`}
                            >
                              {safeGetPerformanceMetrics()?.viral_potential ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Viral Potential
                          </div>
                        </div>

                        <div className="text-center">
                          {/* <div className="flex items-center justify-center mb-1">
                            <MousePointer className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="font-bold text-blue-600">
                              {safeGetPerformanceMetrics()?.estimated_ctr || 0}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">Est. CTR</div> */}
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Users className="h-4 w-4 text-green-500 mr-1" />
                            <span className="font-bold text-green-600">
                              {(
                                safeGetPerformanceMetrics()
                                  ?.estimated_engagement || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Est. Engagement
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content Analysis */}
                {safeGetContentAnalysis() && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Activity className="mr-2 h-5 w-5 text-indigo-500" />
                        Content Analysis
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Title Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-800 flex items-center">
                            <Badge variant="outline" className="mr-2">
                              Title
                            </Badge>
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Length:</span>
                              <span
                                className={
                                  safeGetContentAnalysis()?.title.optimal_length
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }
                              >
                                {safeGetContentAnalysis()?.title.length || 0}{" "}
                                chars
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Words:</span>
                              <span>
                                {safeGetContentAnalysis()?.title.word_count ||
                                  0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Has Numbers:
                              </span>
                              <span
                                className={
                                  safeGetContentAnalysis()?.title.has_numbers
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }
                              >
                                {safeGetContentAnalysis()?.title.has_numbers
                                  ? "Yes"
                                  : "No"}
                              </span>
                            </div>
                            {safeGetContentAnalysis()?.title
                              .capitalization_score && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Capitalization:
                                </span>
                                <span
                                  className={getScoreColor(
                                    safeGetContentAnalysis()?.title
                                      .capitalization_score || 0
                                  )}
                                >
                                  {Math.round(
                                    safeGetContentAnalysis()?.title
                                      .capitalization_score || 0
                                  )}
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-800 flex items-center">
                            <Badge variant="outline" className="mr-2">
                              Description
                            </Badge>
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Length:</span>
                              <span
                                className={
                                  safeGetContentAnalysis()?.description
                                    .optimal_length
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }
                              >
                                {safeGetContentAnalysis()?.description.length ||
                                  0}{" "}
                                chars
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Words:</span>
                              <span>
                                {safeGetContentAnalysis()?.description
                                  .word_count || 0}
                              </span>
                            </div>
                            {safeGetContentAnalysis()?.description
                              .readability_score && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Readability:
                                </span>
                                <span
                                  className={getScoreColor(
                                    safeGetContentAnalysis()?.description
                                      .readability_score || 0
                                  )}
                                >
                                  {Math.round(
                                    safeGetContentAnalysis()?.description
                                      .readability_score || 0
                                  )}
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tags Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-800 flex items-center">
                            <Badge variant="outline" className="mr-2">
                              Tags
                            </Badge>
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Count:</span>
                              <span
                                className={
                                  safeGetContentAnalysis()?.tags.optimal_count
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }
                              >
                                {safeGetContentAnalysis()?.tags.count || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Length:</span>
                              <span>
                                {Math.round(
                                  safeGetContentAnalysis()?.tags
                                    .avg_tag_length || 0
                                )}{" "}
                                chars
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Ready to Analyze
                      </h3>
                      <p className="text-sm text-gray-500">
                        Enter your content details to get AI-powered insights
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ContentEvaluation;
