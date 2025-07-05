import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  Heart,
  Search,
  Tag,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { SavedTitle } from "@/api/titlesApi";
import { useFavoriteTitles, useToggleFavorite } from "@/hooks/useTitleGeneration";

interface FavoriteTitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoriteTitlesModal: React.FC<FavoriteTitlesModalProps> = ({
  isOpen,
  onClose,
}) => {
  // React Query hooks
  const {
    data: favorites = [],
    isLoading: loadingFavorites,
    error,
    refetch: refetchFavorites
  } = useFavoriteTitles();

  const toggleFavoriteMutation = useToggleFavorite();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (title: string, id: string) => {
    navigator.clipboard.writeText(title);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(", "));
  };

  const handleUnfavorite = async (id: string) => {
    try {
      await toggleFavoriteMutation.mutateAsync(id);
      // The mutation handles optimistic updates and UI feedback
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error('Error unfavoriting title:', error);
    }
  };

  const handleRefresh = () => {
    refetchFavorites();
  };

  // Filter titles based on search query with memoization for performance
  const filteredTitles = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    
    const query = searchQuery.toLowerCase();
    return favorites.filter(
      (title: SavedTitle) => 
        title.title.toLowerCase().includes(query) ||
        title.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        ) ||
        (title.generation?.prompt && 
          title.generation.prompt.toLowerCase().includes(query))
    );
  }, [favorites, searchQuery]);

  // Format error message
  const errorMessage = error instanceof Error ? error.message : 'An error occurred';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            Favorite Titles
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {favorites.length}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Your saved favorite titles for YouTube videos
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title, keyword, or prompt..."
            className="pl-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1.5 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              ×
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start mb-4">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-2 h-6 text-xs"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto pr-1">
          {loadingFavorites ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              <p>Loading your favorite titles...</p>
            </div>
          ) : filteredTitles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              {searchQuery ? (
                <>
                  <Search className="h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-center">
                    No titles found matching <strong>"{searchQuery}"</strong>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-teal-600 hover:text-teal-700"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <Heart className="h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-center mb-2">You haven't favorited any titles yet</p>
                  <p className="text-sm text-gray-400 text-center">
                    Generate some titles and click the heart icon to save your favorites
                  </p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <div className="space-y-3">
                {filteredTitles.map((title) => (
                  <motion.div
                    key={title.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="group"
                  >
                    <Card className="overflow-hidden border-teal-100 hover:border-teal-300 transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-1">
                              <div
                                className="text-base font-medium text-gray-800 cursor-pointer flex-grow pr-2 group-hover:text-teal-700 transition-colors"
                                onClick={() => handleCopy(title.title, title.id)}
                                title="Click to copy title"
                              >
                                {title.title}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className="text-teal-500">
                                  {copiedId === title.id ? (
                                    <motion.div
                                      initial={{ scale: 0.8 }}
                                      animate={{ scale: 1 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </motion.div>
                                  ) : (
                                    <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                                <button
                                  className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-full"
                                  onClick={() => handleUnfavorite(title.id)}
                                  disabled={toggleFavoriteMutation.isPending && 
                                           toggleFavoriteMutation.variables === title.id}
                                  title="Remove from favorites"
                                >
                                  {toggleFavoriteMutation.isPending && 
                                   toggleFavoriteMutation.variables === title.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Heart className="h-4 w-4 fill-current" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {title.keywords && title.keywords.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Tag className="h-3.5 w-3.5 text-teal-500 mr-1" />
                                {title.keywords.map((keyword, kidx) => (
                                  <Badge
                                    key={kidx}
                                    variant="outline"
                                    className="bg-white/50 text-xs text-teal-700 border-teal-200 hover:bg-teal-100 cursor-pointer transition-colors"
                                    onClick={() => navigator.clipboard.writeText(keyword)}
                                    title={`Click to copy "${keyword}"`}
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                                <Badge
                                  variant="outline"
                                  className="bg-white/80 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                                  onClick={() => handleCopyKeywords(title.keywords)}
                                  title="Copy all keywords"
                                >
                                  Copy all
                                </Badge>
                              </div>
                            )}

                            {/* Generation info with improved styling */}
                            {title.generation && (
                              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      {format(
                                        new Date(title.generation.createdAt),
                                        "MMM d, yyyy 'at' h:mm a"
                                      )}
                                    </span>
                                  </div>
                                 
                                </div>
                                {title.generation.prompt && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    <span className="font-medium">Prompt: </span>
                                    <span className="italic">
                                      {title.generation.prompt.length > 80
                                        ? `${title.generation.prompt.substring(0, 80)}...`
                                        : title.generation.prompt}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-4 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {searchQuery ? (
                <>
                  Showing {filteredTitles.length} of {favorites.length} favorites
                </>
              ) : (
                <>
                  {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loadingFavorites}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingFavorites ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700">
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FavoriteTitlesModal;