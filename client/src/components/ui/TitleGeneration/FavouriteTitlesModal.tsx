import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { SavedTitle } from "@/api/titlesApi";
import { useTitleGenerations } from "@/hooks/useTitleGeneration";


interface FavoriteTitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoriteTitlesModal: React.FC<FavoriteTitlesModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Use the hook instead of direct API calls
  const {
    favorites,
    loadingFavorites,
    error,
    fetchFavorites,
    toggleFavorite
  } = useTitleGenerations();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, fetchFavorites]);

  const handleCopy = (title: string, id: string) => {
    navigator.clipboard.writeText(title);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyKeywords = (keywords: string[]) => {
    navigator.clipboard.writeText(keywords.join(", "));
  };

  const handleUnfavorite = async (id: string) => {
    const success = await toggleFavorite(id);
    // The hook will automatically update the favorites state
  };

  // Filter titles based on search query
  const filteredTitles = searchQuery.trim() 
    ? favorites.filter(
        (title: SavedTitle) => 
          title.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          title.keywords.some(keyword => 
            keyword.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          (title.generation?.prompt && 
            title.generation.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : favorites;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            Favorite Titles
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
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start mb-4">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-grow overflow-y-auto pr-1">
          {loadingFavorites ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading your favorite titles...</p>
            </div>
          ) : filteredTitles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              {searchQuery ? (
                <>
                  <Search className="h-8 w-8 mb-2 text-gray-400" />
                  <p>No titles found matching your search</p>
                </>
              ) : (
                <>
                  <Heart className="h-8 w-8 mb-2 text-gray-400" />
                  <p>You haven't favorited any titles yet</p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {filteredTitles.map((title) => (
                  <motion.div
                    key={title.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group"
                  >
                    <Card className="overflow-hidden border-teal-100 hover:border-teal-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-1">
                              <div
                                className="text-base font-medium text-gray-800 cursor-pointer flex-grow pr-2 group-hover:text-teal-700"
                                onClick={() => handleCopy(title.title, title.id)}
                              >
                                {title.title}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className="text-teal-500">
                                  {copiedId === title.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                                <button
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  onClick={() => handleUnfavorite(title.id)}
                                  title="Remove from favorites"
                                >
                                  <Heart className="h-4 w-4 fill-current" />
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
                                    className="bg-white/50 text-xs text-teal-700 border-teal-200 hover:bg-teal-100 cursor-pointer"
                                    onClick={() => navigator.clipboard.writeText(keyword)}
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                                <Badge
                                  variant="outline"
                                  className="bg-white/80 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer"
                                  onClick={() => handleCopyKeywords(title.keywords)}
                                >
                                  Copy all
                                </Badge>
                              </div>
                            )}

                            {/* Only show generation info if it exists */}
                            {title.generation && (
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {format(
                                    new Date(title.generation.createdAt),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                                {title.generation.prompt && (
                                  <span className="ml-2 truncate">
                                    • {title.generation.prompt.substring(0, 50)}
                                    {title.generation.prompt.length > 50 ? "..." : ""}
                                  </span>
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

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={fetchFavorites} className="bg-teal-600 hover:bg-teal-700">
            Refresh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FavoriteTitlesModal;