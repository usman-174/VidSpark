import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAnalyzeContent, useEvaluationHealth } from "@/hooks/useEvaluation";
import useAuthStore from "@/store/authStore";
import {
  AnalysisResult,
  PredictionRequest,
  ComparisonData,
} from "@/components/evaluationMatric/types";
import ContentForm from "@/components/evaluationMatric/ContentForm";
import LoadingState from "@/components/evaluationMatric/LoadingState";
import ResultsPanel from "@/components/evaluationMatric/ResultsPanel";
import EmptyState from "@/components/evaluationMatric/EmptyState";
import ComparisonToggle from "@/components/evaluationMatric/ComparisonToggle";
import ComparisonCard from "@/components/evaluationMatric/ComparisonCard";

const ContentEvaluation: React.FC = () => {
  const { user } = useAuthStore();
  const analyzeContentMutation = useAnalyzeContent();
  const { data: healthStatus } = useEvaluationHealth();

  const [formData, setFormData] = useState<PredictionRequest>({
    title: "",
    description: "",
    tags_cleaned: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Comparison mode state
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [firstAnalysisResult, setFirstAnalysisResult] =
    useState<AnalysisResult | null>(null);
  const [firstFormData, setFirstFormData] = useState<PredictionRequest | null>(
    null
  );
  const [secondAnalysisResult, setSecondAnalysisResult] =
    useState<AnalysisResult | null>(null);
  const [secondFormData, setSecondFormData] =
    useState<PredictionRequest | null>(null);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState<
    "first" | "second"
  >("first");

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
      const result = await analyzeContentMutation.mutateAsync(formData);

      if (isComparisonMode) {
        if (currentAnalysisStep === "first") {
          setFirstAnalysisResult(result as AnalysisResult);
          setFirstFormData({ ...formData });
          setCurrentAnalysisStep("second");
          // Clear form for second analysis
          setFormData({ title: "", description: "", tags_cleaned: "" });
        } else {
          setSecondAnalysisResult(result as AnalysisResult);
          setSecondFormData({ ...formData });
        }
      }
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      useAuthStore.getState().refreshUser();
    }
  };

  const handleClearForm = () => {
    setFormData({ title: "", description: "", tags_cleaned: "" });
    setErrors({});
    localStorage.removeItem("content-evaluation-form");
  };

  const handleSampleData = () => {
    if (isComparisonMode && currentAnalysisStep === "second") {
      // Different sample data for second comparison
      setFormData({
        title: "How I Gained 1M Followers on TikTok Using This Simple Strategy",
        description:
          "Discover the one strategy that changed everything for my TikTok growth. In this comprehensive guide, I'll walk you through the exact method I used to gain 1 million followers in just 8 months. This isn't about luck - it's about understanding the algorithm and creating content that resonates. Perfect for creators looking to scale their presence.",
        tags_cleaned:
          "tiktok growth, follower strategy, social media tips, content creator, viral marketing, algorithm hack, influencer tips, tiktok followers",
      });
    } else {
      setFormData({
        title:
          "5 Secrets to Viral TikTok Content That Got Me 10M Views in 2024",
        description:
          "In this video, I'll reveal the exact strategies I used to create viral TikTok content that generated over 10 million views in just 6 months. You'll learn the 5 secret techniques that top creators use but never talk about publicly. From trending hashtags to optimal posting times, I'll show you everything you need to know to blow up on TikTok.",
        tags_cleaned:
          "viral content, tiktok tips, social media marketing, content creation, viral videos, tiktok algorithm, social media growth, content strategy",
      });
    }
    setErrors({});
  };

  const handleToggleComparison = () => {
    if (isComparisonMode) {
      // Exit comparison mode - reset everything
      setIsComparisonMode(false);
      setFirstAnalysisResult(null);
      setFirstFormData(null);
      setSecondAnalysisResult(null);
      setSecondFormData(null);
      setCurrentAnalysisStep("first");
    } else {
      // Enter comparison mode
      setIsComparisonMode(true);
      setCurrentAnalysisStep("first");
      // If there's already a result, make it the first comparison item
      if (analyzeContentMutation.data) {
        setFirstAnalysisResult(analyzeContentMutation.data as AnalysisResult);
        setFirstFormData({ ...formData });
        setCurrentAnalysisStep("second");
        setFormData({ title: "", description: "", tags_cleaned: "" });
      }
    }
  };

  const analysisResult = analyzeContentMutation.data as
    | AnalysisResult
    | undefined;

  // Determine what to show
  const showComparison =
    isComparisonMode &&
    firstAnalysisResult &&
    secondAnalysisResult &&
    firstFormData &&
    secondFormData;
  const comparisonData: ComparisonData | null = showComparison
    ? {
        firstResult: firstAnalysisResult,
        secondResult: secondAnalysisResult,
        firstFormData,
        secondFormData,
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Comparison Toggle */}
        <ComparisonToggle
          isComparisonMode={isComparisonMode}
          onToggleComparison={handleToggleComparison}
          hasFirstResult={!!analysisResult}
        />

        {/* Input Form */}
        <ContentForm
          formData={formData}
          errors={errors}
          user={user}
          isLoading={analyzeContentMutation.isPending}
          isHealthy={healthStatus?.success || false}
          onInputChange={handleInputChange}
          onAnalyze={handleAnalyze}
          onClearForm={handleClearForm}
          onSampleData={handleSampleData}
          isComparisonMode={isComparisonMode}
          currentAnalysisStep={currentAnalysisStep}
        />

        {/* Results Panel */}
        <AnimatePresence mode="wait">
          {analyzeContentMutation.isPending ? (
            <LoadingState />
          ) : comparisonData ? (
            <ComparisonCard comparisonData={comparisonData} />
          ) : analysisResult && !isComparisonMode ? (
            <ResultsPanel analysisResult={analysisResult} />
          ) : isComparisonMode &&
            firstAnalysisResult &&
            currentAnalysisStep === "second" ? (
            <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                First Analysis Complete!
              </h3>
              <p className="text-blue-700">
                Now enter your second content variation to compare results.
              </p>
            </div>
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContentEvaluation;
