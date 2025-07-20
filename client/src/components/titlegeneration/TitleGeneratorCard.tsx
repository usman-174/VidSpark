import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  Tag,
  ThumbsUp,
  AlertCircle,
  Heart,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import useAuthStore from "@/store/authStore";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTitleManager } from "@/hooks/useTitleManager";

interface TitleGeneratorCardProps {
  onFavoritesClick: () => void;
}

const TitleGeneratorCard: React.FC<TitleGeneratorCardProps> = ({
  onFavoritesClick,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Use the merged hook
  const {
    generatedTitles: titles,
    isGenerating,
    isTogglingFavorite,
    generateTitles,
    toggleFavorite,
    clearTitles,
  } = useTitleManager();

  // Local UI state
  const [keywords, setKeywords] = useState("");
  const [copiedStates, setCopiedStates] = useState({
    title: null as number | null,
    keywords: null as number | null,
    description: null as number | null,
  });
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(
    new Set()
  );

  // Check if user has credits
  const hasCredits = user?.creditBalance ? user.creditBalance > 0 : false;

  // Helper functions
  const parseKeywords = (input: string): string[] => {
    return input
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);
  };

  const validateKeywords = (input: string): boolean => {
    const keywordArray = parseKeywords(input);
    return keywordArray.length >= 3 && keywordArray.length <= 5;
  };

  const handleBuyCredits = () => {
    navigate("/packages");
  };

  const handleGenerate = async () => {
    const keywordArray = parseKeywords(keywords);

    if (!validateKeywords(keywords)) {
      toast.error("Please enter 3-5 keywords, separated by commas.");
      return;
    }

    if (!hasCredits) {
      toast.error(
        "You have no credits left. Please purchase more to generate titles."
      );
      return;
    }

    // Reset UI state
    setCopiedStates({ title: null, keywords: null, description: null });
    setExpandedDescriptions(new Set());

    await generateTitles(keywordArray);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleGenerate();
    }
  };

  // Copy functions
  const handleCopy = (
    text: string,
    type: "title" | "keywords" | "description",
    index: number
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [type]: index }));
    setTimeout(
      () => setCopiedStates((prev) => ({ ...prev, [type]: null })),
      2000
    );

    const typeNames = {
      title: "Title",
      keywords: "Keywords",
      description: "Description",
    };
    toast.success(`${typeNames[type]} copied to clipboard!`);
  };

  // Toggle description expansion
  const toggleDescriptionExpansion = (index: number) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDescriptions(newExpanded);
  };

  const handleToggleFavorite = async (titleId: string) => {
    await toggleFavorite(titleId);
  };

  return (
    <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center text-xl sm:text-2xl font-bold">
            <Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
            YouTube Title Generator
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFavoritesClick}
            className="text-white hover:bg-white/20 flex items-center"
          >
            <Heart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Favorites</span>
          </Button>
        </div>
        <p className="text-center text-white/90 text-xs sm:text-sm">
          Generate high-converting, SEO-optimized YouTube titles with AI
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <Label
            htmlFor="keywords"
            className="text-sm font-medium text-gray-700"
          >
            Enter 3-5 keywords (comma-separated)
          </Label>
          <Input
            id="keywords"
            placeholder="e.g., Instagram Reels, viral videos, beginner guide, social media, content creation"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyUp={handleKeyPress}
            className={`border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg ${
              !hasCredits ? "opacity-75" : ""
            }`}
            disabled={!hasCredits || isGenerating}
          />

          {/* Credits Warning - No Credits */}
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
                    You need credits to generate YouTube titles. Purchase
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

          {/* Credits Warning - Low Credits */}
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

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !validateKeywords(keywords) || !hasCredits}
          className={`w-full font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center ${
            hasCredits
              ? "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : !hasCredits ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              No Credits Available
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Titles
            </>
          )}
        </Button>
      </CardContent>

      {/* Generated Titles */}
      {titles.length > 0 && (
        <CardContent className="pt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-teal-100 bg-teal-100/30">
              <h3 className="text-teal-800 font-medium flex items-center">
                <ThumbsUp className="h-4 w-4 mr-2 text-teal-600" />
                Generated Titles
              </h3>
              <p className="text-xs text-teal-600 mt-1">
                Click on titles or descriptions to copy to clipboard
              </p>
            </div>

            <div className="divide-y divide-teal-100">
              {titles.map((title, index) => (
                <motion.div
                  key={title.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 hover:bg-teal-100/30 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                      {/* Title Section */}
                      <div className="flex justify-between items-start mb-3">
                        <p
                          className="text-gray-800 font-medium pr-2 cursor-pointer flex-1 text-sm sm:text-base leading-relaxed"
                          onClick={() =>
                            handleCopy(title.title, "title", index)
                          }
                          title="Click to copy title"
                        >
                          {title.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(title.title, "title", index)
                          }
                          className="text-teal-500 hover:text-teal-700 ml-2 p-1 flex-shrink-0"
                          title="Copy title"
                        >
                          {copiedStates.title === index ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Button>
                      </div>

                      {/* Description Section */}
                      {title.description && (
                        <div className="mb-3 bg-white/50 rounded-lg p-3 border border-teal-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-2">
                                <FileText className="h-3.5 w-3.5 text-teal-600 mr-1.5 flex-shrink-0" />
                                <span className="text-xs font-medium text-teal-700">
                                  Description
                                </span>
                              </div>
                              <div className="relative">
                                <p
                                  className={`text-gray-700 text-xs sm:text-sm leading-relaxed cursor-pointer transition-all duration-200 ${
                                    !expandedDescriptions.has(index)
                                      ? "line-clamp-2"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleCopy(
                                      title.description,
                                      "description",
                                      index
                                    )
                                  }
                                  title="Click to copy description"
                                >
                                  {title.description}
                                </p>

                                {title.description.length > 100 && (
                                  <button
                                    onClick={() =>
                                      toggleDescriptionExpansion(index)
                                    }
                                    className="mt-1 text-xs text-teal-600 hover:text-teal-800 flex items-center transition-colors"
                                  >
                                    {expandedDescriptions.has(index) ? (
                                      <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Show less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Show more
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopy(
                                  title.description,
                                  "description",
                                  index
                                )
                              }
                              className="text-teal-500 hover:text-teal-700 ml-2 p-1 flex-shrink-0"
                              title="Copy description"
                            >
                              {copiedStates.description === index ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Keywords Section */}
                      {title.keywords.length > 0 && (
                        <div className="bg-white/30 rounded-lg p-3 border border-teal-100">
                          <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex items-center mr-2">
                              <Tag className="h-3.5 w-3.5 text-teal-500 mr-1" />
                              <span className="text-xs font-medium text-teal-700">
                                Keywords:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {title.keywords.map((keyword, kidx) => (
                                <Badge
                                  key={kidx}
                                  variant="outline"
                                  className="bg-white/70 text-xs text-teal-700 border-teal-200 hover:bg-teal-100 cursor-pointer transition-colors"
                                  onClick={() =>
                                    navigator.clipboard.writeText(keyword)
                                  }
                                  title="Click to copy keyword"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-blue-600 hover:text-blue-800 p-1 ml-auto"
                              onClick={() =>
                                handleCopy(
                                  title.keywords.join(", "),
                                  "keywords",
                                  index
                                )
                              }
                              title="Copy all keywords"
                            >
                              {copiedStates.keywords === index ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">
                                    Copy all
                                  </span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Favorite button */}
                    <button
                      className={`ml-3 flex-shrink-0 p-2 rounded-full transition-colors ${
                        title.isFavorite
                          ? "text-red-500 hover:text-red-700 bg-red-50"
                          : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                      onClick={() => handleToggleFavorite(title.id)}
                      disabled={isTogglingFavorite}
                      title={
                        title.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      {isTogglingFavorite ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart
                          className={`h-4 w-4 ${
                            title.isFavorite ? "fill-current" : ""
                          }`}
                        />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </CardContent>
      )}

      <CardFooter className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 bg-gray-50 px-6 py-3 gap-2">
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
        <div className="text-center sm:text-right">
          Cost: 1 credit per generation
        </div>
      </CardFooter>
    </Card>
  );
};

export default TitleGeneratorCard;