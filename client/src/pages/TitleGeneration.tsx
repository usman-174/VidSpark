import { useState, useMemo } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import useAuthStore from "@/store/authStore";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import FavoriteTitlesModal from "@/components/ui/TitleGeneration/FavouriteTitlesModal";
import { 
  useGenerateTitles, 
  useTitleGeneration, 
  useToggleFavorite 
} from "@/hooks/useTitleGeneration";

// Interface for title with keywords
interface TitleWithKeywords {
  title: string;
  keywords: string[];
}

// Type for generated titles
type GeneratedTitle = string | TitleWithKeywords;

const TitleGeneration = () => {
  const { user } = useAuthStore();

  // React Query hooks
  const generateTitlesMutation = useGenerateTitles();
  const toggleFavoriteMutation = useToggleFavorite();

  // Local state
  const [prompt, setPrompt] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  // Fetch the current generation data if we have an ID
  const { data: currentGeneration } = useTitleGeneration(currentGenerationId);

  // Memoize saved title IDs and favorite status from current generation
  const { savedTitleIds, favoriteStatus } = useMemo(() => {
    if (!currentGeneration?.titles) {
      return { savedTitleIds: {}, favoriteStatus: {} };
    }

    const savedIds: Record<number, string> = {};
    const favorites: Record<number, boolean> = {};

    currentGeneration.titles.forEach((savedTitle, index) => {
      if (index < generatedTitles.length) {
        savedIds[index] = savedTitle.id;
        favorites[index] = savedTitle.isFavorite;
      }
    });

    return { savedTitleIds: savedIds, favoriteStatus: favorites };
  }, [currentGeneration, generatedTitles.length]);

  // Helper functions
  const hasKeywords = (title: GeneratedTitle): title is TitleWithKeywords => {
    return typeof title !== "string" && "keywords" in title;
  };

  const getTitleString = (title: GeneratedTitle): string => {
    return typeof title === "string" ? title : title.title;
  };

  const getKeywords = (title: GeneratedTitle): string[] => {
    return typeof title === "string" ? [] : title.keywords || [];
  };

  // Parse API response
  const extractTitlesFromResponse = (response: any): GeneratedTitle[] => {
    try {
      if (response?.titles && Array.isArray(response.titles)) {
        return response.titles
          .filter(
            (t: any) =>
              t && (typeof t.title === "string" || typeof t === "string")
          )
          .slice(0, 5);
      }
      return [];
    } catch (e) {
      console.error("Error parsing titles:", e);
      return [];
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (user?.creditBalance === 0) {
      toast({
        title: "Insufficient credits",
        description: "You need credits to generate titles.",
        variant: "destructive",
      });
      return;
    }

    // Reset state
    setGeneratedTitles([]);
    setCurrentGenerationId(null);

    try {
      const result = await generateTitlesMutation.mutateAsync({
        prompt: prompt.trim(),
        includeKeywords: true,
      });

      const extractedTitles = extractTitlesFromResponse(result);

      if (extractedTitles.length > 0) {
        setGeneratedTitles(extractedTitles);
        
        // Set the generation ID to trigger fetching detailed data
        if (result.generationId) {
          setCurrentGenerationId(result.generationId);
        }
      } else {
        toast({
          title: "No titles generated",
          description: "Could not generate titles. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error("Error generating titles:", error);
    }
  };

  const handleCopy = (title: GeneratedTitle, index: number) => {
    navigator.clipboard.writeText(getTitleString(title));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(", "));
  };

  const handleToggleFavorite = async (index: number) => {
    const titleId = savedTitleIds[index];
    
    if (!titleId) {
      toast({
        title: "Cannot favorite this title",
        description: "This title hasn't been saved to the database yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(titleId);
      // The mutation handles the optimistic updates and success messages
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error("Error toggling favorite status:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !generateTitlesMutation.isPending && prompt.trim()) {
      handleGenerate();
    }
  };

  // Show error from generation mutation
  const error = generateTitlesMutation.error?.message;

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white">
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center text-2xl font-bold">
                <Sparkles className="mr-2 h-6 w-6 text-yellow-300" />
                YouTube Title Generator
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFavoritesModalOpen(true)}
                className="text-white hover:bg-white/20 flex items-center"
              >
                <Heart className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
            </div>
            <p className="text-center text-white/90 text-sm">
              Generate high-converting, SEO-optimized YouTube titles with AI
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label
                htmlFor="prompt"
                className="text-sm font-medium text-gray-700"
              >
                What is your video about?
              </Label>
              <Input
                id="prompt"
                placeholder="e.g., A beginner's guide to creating Instagram Reels that go viral"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateTitlesMutation.isPending || !prompt.trim()}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
            >
              {generateTitlesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Titles
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

          {generatedTitles.length > 0 && (
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
                    Click on a title to copy to clipboard
                  </p>
                </div>

                <div className="divide-y divide-teal-100">
                  {generatedTitles.map((title, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 hover:bg-teal-100/30 transition-colors group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => handleCopy(title, index)}
                          >
                            <p className="text-gray-800 font-medium pr-2">
                              {getTitleString(title)}
                            </p>
                            <div className="text-teal-500">
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </div>

                          {hasKeywords(title) && title.keywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Tag className="h-3.5 w-3.5 text-teal-500 mr-1" />
                              {title.keywords.map((keyword, kidx) => (
                                <Badge
                                  key={kidx}
                                  variant="outline"
                                  className="bg-white/50 text-xs text-teal-700 border-teal-200 hover:bg-teal-100 cursor-pointer"
                                  onClick={() =>
                                    navigator.clipboard.writeText(keyword)
                                  }
                                >
                                  {keyword}
                                </Badge>
                              ))}
                              <Badge
                                variant="outline"
                                className="bg-white/80 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer"
                                onClick={() =>
                                  handleCopyKeywords(getKeywords(title))
                                }
                              >
                                Copy all
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Favorite button - only show if we have saved title IDs */}
                        {savedTitleIds[index] && (
                          <button
                            className={`ml-2 flex-shrink-0 p-1.5 rounded-full transition-colors ${
                              favoriteStatus[index]
                                ? "text-red-500 hover:text-red-700 bg-red-50"
                                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                            }`}
                            onClick={() => handleToggleFavorite(index)}
                            disabled={toggleFavoriteMutation.isPending}
                            title={
                              favoriteStatus[index]
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            {toggleFavoriteMutation.isPending && 
                             toggleFavoriteMutation.variables === savedTitleIds[index] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart
                                className={`h-4 w-4 ${
                                  favoriteStatus[index] ? "fill-current" : ""
                                }`}
                              />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </CardContent>
          )}

          <CardFooter className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 px-6 py-3">
            <div>
              Available Credits:{" "}
              <span className="font-medium">{user?.creditBalance || 0}</span>
            </div>
            <div>Cost: 1 credit per generation</div>
          </CardFooter>
        </Card>
      </div>

      {/* Favorite Titles Modal */}
      <FavoriteTitlesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
      />
    </>
  );
};

export default TitleGeneration;