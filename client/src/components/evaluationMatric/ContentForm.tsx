import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Info, AlertTriangle, Loader2, Zap } from "lucide-react";
import { PredictionRequest } from "./types";
import { User } from "@/store/authStore";

interface ContentFormProps {
  formData: PredictionRequest;
  errors: Record<string, string>;
  user: User | null;
  isLoading: boolean;
  isHealthy: boolean;
  onInputChange: (field: keyof PredictionRequest, value: string) => void;
  onAnalyze: () => void;
  onClearForm: () => void;
  onSampleData: () => void;
  isComparisonMode?: boolean;
  currentAnalysisStep?: "first" | "second";
}

const ContentForm: React.FC<ContentFormProps> = ({
  formData,
  errors,
  user,
  isLoading,
  isHealthy,
  onInputChange,
  onAnalyze,
  onClearForm,
  onSampleData,
  isComparisonMode = false,
  currentAnalysisStep = "first",
}) => {
  const isFormValid =
    formData.title.trim() &&
    formData.description.trim() &&
    formData.tags_cleaned.trim();
  const tagCount = formData.tags_cleaned
    .split(",")
    .filter((t) => t.trim()).length;

  const getHeaderTitle = () => {
    if (isComparisonMode) {
      return currentAnalysisStep === "first"
        ? "Content Analyzer - First Content"
        : "Content Analyzer - Second Content";
    }
    return "Content Analyzer";
  };

  const getHeaderDescription = () => {
    if (isComparisonMode) {
      return currentAnalysisStep === "first"
        ? "Enter your first content variation for comparison"
        : "Enter your second content variation to complete the comparison";
    }
    return "Get AI-powered view predictions and optimization insights";
  };

  return (
    <Card className="shadow-lg border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-b from-teal-800 to-teal-900 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center">
            <BarChart3 className="mr-2 h-6 w-6" />
            {getHeaderTitle()}
          </div>
          {isComparisonMode && (
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              Step {currentAnalysisStep === "first" ? "1" : "2"} of 2
            </Badge>
          )}
        </CardTitle>
        <p className="text-blue-100 text-sm">{getHeaderDescription()}</p>
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
            onChange={(e) => onInputChange("title", e.target.value)}
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
            onChange={(e) => onInputChange("description", e.target.value)}
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
            onChange={(e) => onInputChange("tags_cleaned", e.target.value)}
            className={errors.tags_cleaned ? "border-red-500" : ""}
          />
          {errors.tags_cleaned && (
            <p className="text-xs text-red-500">{errors.tags_cleaned}</p>
          )}
          <p className="text-xs text-gray-500">{tagCount} tags</p>
        </div>

        {/* Disclaimer */}
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            <strong>Disclaimer:</strong> AI predictions are estimates. Actual
            performance may vary due to timing, trends, algorithm changes, and
            other factors.
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
            <span>Cost: 1 credit{isComparisonMode ? " per analysis" : ""}</span>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSampleData}
              disabled={isLoading}
            >
              Sample Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearForm}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button
              onClick={onAnalyze}
              disabled={isLoading || !isHealthy || !isFormValid}
              className="flex-1 bg-gradient-to-b from-teal-800 to-teal-900 hover:bg-teal-700/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {isComparisonMode
                    ? `Analyze ${
                        currentAnalysisStep === "first" ? "First" : "Second"
                      } Content`
                    : "Analyze"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ContentForm;
