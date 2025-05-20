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
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  Tag,
  Info,
  ThumbsUp,
  AlertCircle,
  Heart,
  BookmarkPlus,
  List,
  Clock,
  History,
} from "lucide-react";
import { motion } from "framer-motion";
import { titlesAPI } from "@/api/titlesApi";
import useAuthStore from "@/store/authStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import FavoriteTitlesModal from "@/components/ui/TitleGeneration/FavouriteTitlesModal";

// Interface for title with keywords
interface TitleWithKeywords {
  title: string;
  keywords: string[];
}

// Type for generated titles that can be either strings or objects with title and keywords
type GeneratedTitle = string | TitleWithKeywords;

// Interface for a title with ID for saving/favoriting
interface SavedTitle {
  id: string;
  title: string;
  keywords: string[];
  isFavorite: boolean;
}

// Interface for title generation result with generation ID
interface TitleGenerationResult {
  success: boolean;
  titles: GeneratedTitle[];
  provider?: string;
  error?: string;
  generationId?: string;
}

const TitleGeneration = () => {
  const { user } = useAuthStore();

  const [prompt, setPrompt] = useState("");
  const [detailedPrompt, setDetailedPrompt] = useState("");
  const [isDetailedPrompt, setIsDetailedPrompt] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [suggestions, setSuggestions] = useState({
    targetAudience: "YouTubers, content creators, digital marketers",
    contentType: "YouTube video, short-form video, tutorial",
    keyPhrases: "how to, tutorial, step-by-step, beginners guide",
  });

  // New state for favorites functionality
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(
    null
  );
  const [savedTitleIds, setSavedTitleIds] = useState<Record<number, string>>(
    {}
  );
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>(
    {}
  );
  const [savingFavorite, setSavingFavorite] = useState<Record<number, boolean>>(
    {}
  );

  // Helper function to determine if a title has keywords
  const hasKeywords = (title: GeneratedTitle): title is TitleWithKeywords => {
    return typeof title !== "string" && "keywords" in title;
  };

  // Helper function to extract title string regardless of format
  const getTitleString = (title: GeneratedTitle): string => {
    if (typeof title === "string") {
      return title;
    }
    return title.title;
  };

  // Helper function to extract keywords if they exist
  const getKeywords = (title: GeneratedTitle): string[] => {
    if (typeof title === "string") {
      return [];
    }
    return title.keywords || [];
  };

  // Helper function to parse potentially malformed responses
  const extractTitlesFromResponse = (response: any): GeneratedTitle[] => {
    try {
      // Case 1: If we have items array with title and keywords (new format)
      if (
        response?.titles &&
        Array.isArray(response.titles) &&
        typeof response.titles[0] === "object"
      ) {
        return response.titles
          .filter(
            (t: any) =>
              t && (typeof t.title === "string" || typeof t === "string")
          )
          .slice(0, 5);
      }

      // Case 2: If we have a regular titles array (old format)
      if (
        response?.titles &&
        Array.isArray(response.titles) &&
        typeof response.titles[0] === "string"
      ) {
        return response.titles.slice(0, 5);
      }

      // Fall back to empty array if format is unrecognized
      console.error("Unrecognized response format:", response);
      return [];
    } catch (e) {
      console.error("Error parsing titles:", e);
      return [];
    }
  };

  // Generate a more detailed prompt based on user input and suggestions
  const generateDetailedPrompt = () => {
    const basePrompt = prompt.trim();
    if (!basePrompt) return "";

    return `I need SEO-optimized titles for a YouTube video about: ${basePrompt}

Target audience: ${suggestions.targetAudience}
Content type: ${suggestions.contentType}
Key phrases to include: ${suggestions.keyPhrases}

${detailedPrompt ? `Additional details: ${detailedPrompt}` : ""}

The title should:
- Be catchy and attention-grabbing
- Include relevant keywords for search
- Be 50-65 characters in length
- Create curiosity or promise value
- Follow YouTube best practices for 2025`;
  };

  const handleGenerate = async () => {
    const finalPrompt = isDetailedPrompt ? generateDetailedPrompt() : prompt;

    if (!finalPrompt.trim()) return;

    if (user?.creditBalance === 0) {
      setError("Insufficient credits to generate titles.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedTitles([]);
    setCurrentGenerationId(null);
    setSavedTitleIds({});
    setFavoriteStatus({});

    try {
      const result = await titlesAPI.generateTitles({
        prompt: finalPrompt,
        includeKeywords: includeKeywords,
      });

      // Try to extract titles from the response
      const extractedTitles = extractTitlesFromResponse(result);

      if (extractedTitles.length > 0) {
        setGeneratedTitles(extractedTitles);

        // Check if we have a generationId (from our enhanced backend)
        if ("generationId" in result && result.generationId) {
          setCurrentGenerationId(result.generationId);

          // Fetch the saved titles with their IDs
          try {
            const savedGeneration = await axios.get(
              `/titles/generations/${result.generationId}`
            );
            if (
              savedGeneration.data.success &&
              savedGeneration.data.generation
            ) {
              // Map the saved title IDs to their index position
              const newSavedTitleIds: Record<number, string> = {};
              const newFavoriteStatus: Record<number, boolean> = {};

              savedGeneration.data.generation.titles.forEach(
                (savedTitle: SavedTitle, index: number) => {
                  if (index < extractedTitles.length) {
                    newSavedTitleIds[index] = savedTitle.id;
                    newFavoriteStatus[index] = savedTitle.isFavorite;
                  }
                }
              );

              setSavedTitleIds(newSavedTitleIds);
              setFavoriteStatus(newFavoriteStatus);
            }
          } catch (fetchError) {
            console.error(
              "Error fetching saved generation details:",
              fetchError
            );
          }
        }
      } else {
        // If we couldn't extract any titles, show an error
        setError("Could not parse titles from the response. Please try again.");
        console.error("Malformed response:", result);
      }
    } catch (error) {
      console.error("Error generating titles:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

  // Toggle favorite status for a title
  const handleToggleFavorite = async (index: number) => {
    // If we don't have a title ID for this index, we can't favorite it
    if (!savedTitleIds[index]) {
      toast({
        title: "Cannot favorite this title",
        description: "This title hasn't been saved to the database yet.",
        variant: "destructive",
      });
      return;
    }

    setSavingFavorite({ ...savingFavorite, [index]: true });

    try {
      const titleId = savedTitleIds[index];
      const response = await axios.put(`/titles/${titleId}/favorite`);

      if (response.data.success) {
        // Toggle the favorite status locally
        const newStatus = !favoriteStatus[index];
        setFavoriteStatus({ ...favoriteStatus, [index]: newStatus });

        toast({
          title: newStatus ? "Added to favorites" : "Removed from favorites",
          description: newStatus
            ? "Title has been added to your favorites"
            : "Title has been removed from your favorites",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast({
        title: "Failed to update favorite status",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSavingFavorite({ ...savingFavorite, [index]: false });
    }
  };

  // Update suggestions based on prompt
  const updateSuggestions = () => {
    // This would be better with a real API but for now just simulate
    const promptLower = prompt.toLowerCase();

    if (promptLower.includes("game") || promptLower.includes("gaming")) {
      setSuggestions({
        targetAudience: "Gamers, gaming enthusiasts, streamers",
        contentType: "Gaming video, gameplay, review, tutorial",
        keyPhrases: "gameplay, walkthrough, tips and tricks, best strategy",
      });
    } else if (
      promptLower.includes("cook") ||
      promptLower.includes("recipe") ||
      promptLower.includes("food")
    ) {
      setSuggestions({
        targetAudience: "Home cooks, food lovers, cooking enthusiasts",
        contentType: "Recipe video, cooking tutorial, food review",
        keyPhrases: "easy recipe, homemade, delicious, how to make",
      });
    } else if (
      promptLower.includes("tech") ||
      promptLower.includes("software") ||
      promptLower.includes("programming")
    ) {
      setSuggestions({
        targetAudience: "Developers, tech enthusiasts, IT professionals",
        contentType: "Tech tutorial, code walkthrough, product review",
        keyPhrases: "tutorial, how to, beginners guide, explained simply",
      });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white">
            <div className="flex justify-between items-start">
              <CardTitle className="flex justify-center items-center text-2xl font-bold">
                <Sparkles className="mr-2 h-6 w-6 text-yellow-300" />
                YouTube Title Generator
              </CardTitle>
              <div className="flex space-x-2">
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
            </div>
            <p className="text-center text-white/90 text-sm">
              Generate high-converting, SEO-optimized YouTube titles with AI
            </p>
          </CardHeader>

          <Tabs
            defaultValue="basic"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="prompt"
                      className="text-sm font-medium text-gray-700"
                    >
                      What is your video about?
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80 text-xs">
                            Describe your video content. Be specific about the
                            main topic, target audience, and what viewers will
                            learn or experience.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="prompt"
                    placeholder="e.g., A beginner's guide to creating Instagram Reels that go viral"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      if (e.target.value.length > 10) {
                        updateSuggestions();
                      }
                    }}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="keywords-mode"
                      checked={includeKeywords}
                      onCheckedChange={setIncludeKeywords}
                    />
                    <Label
                      htmlFor="keywords-mode"
                      className="text-sm text-gray-600"
                    >
                      Include keyword suggestions
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="detailed-mode"
                      checked={isDetailedPrompt}
                      onCheckedChange={setIsDetailedPrompt}
                    />
                    <Label
                      htmlFor="detailed-mode"
                      className="text-sm text-gray-600"
                    >
                      Use detailed prompt
                    </Label>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
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
            </TabsContent>

            <TabsContent value="advanced">
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="detailed-prompt"
                    className="text-sm font-medium text-gray-700"
                  >
                    Basic Topic
                  </Label>
                  <Input
                    id="basic-prompt-advanced"
                    placeholder="e.g., A beginner's guide to creating Instagram Reels"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      if (e.target.value.length > 10) {
                        updateSuggestions();
                      }
                    }}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="target-audience"
                    className="text-sm font-medium text-gray-700"
                  >
                    Target Audience
                  </Label>
                  <Input
                    id="target-audience"
                    placeholder="e.g., Social media managers, content creators, marketing professionals"
                    value={suggestions.targetAudience}
                    onChange={(e) =>
                      setSuggestions({
                        ...suggestions,
                        targetAudience: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="content-type"
                    className="text-sm font-medium text-gray-700"
                  >
                    Content Type
                  </Label>
                  <Input
                    id="content-type"
                    placeholder="e.g., Tutorial, review, how-to guide, entertainment"
                    value={suggestions.contentType}
                    onChange={(e) =>
                      setSuggestions({
                        ...suggestions,
                        contentType: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="key-phrases"
                    className="text-sm font-medium text-gray-700"
                  >
                    Key Phrases to Include
                  </Label>
                  <Input
                    id="key-phrases"
                    placeholder="e.g., how to, tutorial, step by step, beginners guide"
                    value={suggestions.keyPhrases}
                    onChange={(e) =>
                      setSuggestions({
                        ...suggestions,
                        keyPhrases: e.target.value,
                      })
                    }
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="additional-details"
                    className="text-sm font-medium text-gray-700"
                  >
                    Additional Details (Optional)
                  </Label>
                  <Textarea
                    id="additional-details"
                    placeholder="Add any other details about your video content that will help generate better titles..."
                    value={detailedPrompt}
                    onChange={(e) => setDetailedPrompt(e.target.value)}
                    className="min-h-24 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="keywords-mode-advanced"
                    checked={includeKeywords}
                    onCheckedChange={setIncludeKeywords}
                  />
                  <Label
                    htmlFor="keywords-mode-advanced"
                    className="text-sm text-gray-600"
                  >
                    Include keyword suggestions
                  </Label>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Optimized Titles
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
            </TabsContent>
          </Tabs>

          {generatedTitles.length > 0 && (
            <CardContent className="pt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-teal-100 bg-teal-100/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-teal-800 font-medium flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-2 text-teal-600" />
                      Generated Titles
                    </h3>
                    <p className="text-xs text-teal-600">
                      Click on a title to copy to clipboard
                    </p>
                  </div>
                  {currentGenerationId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-xs text-teal-600">
                            <BookmarkPlus className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Saved</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>These titles are saved to your account</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
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
                            <div className="text-teal-500 flex items-center space-x-2">
                              {/* Copy button */}
                              <div>
                                {copiedIndex === index ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
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
                            disabled={savingFavorite[index]}
                            title={
                              favoriteStatus[index]
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            {savingFavorite[index] ? (
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
