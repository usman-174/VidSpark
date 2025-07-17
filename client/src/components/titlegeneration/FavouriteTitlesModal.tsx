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
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

import { SavedTitle } from "@/api/titlesApi";
import { useFavoriteTitles } from "@/hooks/useFavoriteTitles";

interface FavoriteTitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoriteTitlesModal: React.FC<FavoriteTitlesModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Use the updated hook with useQuery
  const {
    favorites,
    isLoading,
    error,
    removeFavorite,
    refreshFavorites,
    isRemoving,
    isMutating,
  } = useFavoriteTitles();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedStates, setCopiedStates] = useState({
    title: null as string | null,
    description: null as string | null,
    keywords: null as string | null,
  });
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // Copy functions
  const handleCopy = (text: string, type: 'title' | 'description' | 'keywords', id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: id }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: null })), 2000);
    
    const typeNames = {
      title: 'Title',
      description: 'Description',
      keywords: 'Keywords'
    };
    toast.success(`${typeNames[type]} copied to clipboard!`);
  };

  const handleCopyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    toast.success('Keyword copied to clipboard!');
  };

  const toggleDescriptionExpansion = (id: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDescriptions(newExpanded);
  };

  const handleUnfavorite = async (id: string) => {
    try {
      await removeFavorite(id);
    } catch (error) {
      // Error is already handled by the hook with toast
      console.error('Failed to remove favorite:', error);
    }
  };

  const handleRefresh = () => {
    refreshFavorites();
  };

  // Filter titles based on search query with memoization for performance
  const filteredTitles = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    
    const query = searchQuery.toLowerCase();
    return favorites.filter(
      (title: SavedTitle) => 
        title.title.toLowerCase().includes(query) ||
        (title.description && title.description.toLowerCase().includes(query)) ||
        title.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        ) ||
        (title.generation?.prompt && 
          title.generation.prompt.toLowerCase().includes(query))
    );
  }, [favorites, searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
            Your saved favorite titles for YouTube videos with descriptions and keywords
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title, description, keyword, or prompt..."
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
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="ml-2 h-6 text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto pr-1">
          {isLoading ? (
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
              <div className="space-y-4">
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
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex justify-between items-start">
                          <div className="w-full min-w-0">
                            {/* Title Section */}
                            <div className="flex justify-between items-start mb-3">
                              <div
                                className="text-base sm:text-lg font-medium text-gray-800 cursor-pointer flex-grow pr-2 group-hover:text-teal-700 transition-colors leading-relaxed"
                                onClick={() => handleCopy(title.title, 'title', title.id)}
                                title="Click to copy title"
                              >
                                {title.title}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <div className="text-teal-500">
                                  {copiedStates.title === title.id ? (
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
                                  className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleUnfavorite(title.id)}
                                  disabled={isRemoving || isMutating}
                                  title="Remove from favorites"
                                >
                                  {isRemoving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Heart className="h-4 w-4 fill-current" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Description Section */}
                            {title.description && (
                              <div className="mb-4 bg-teal-50/50 rounded-lg p-3 border border-teal-100">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center mb-2">
                                      <FileText className="h-3.5 w-3.5 text-teal-600 mr-1.5 flex-shrink-0" />
                                      <span className="text-xs font-medium text-teal-700">Description</span>
                                    </div>
                                    <div className="relative">
                                      <p
                                        className={`text-gray-700 text-xs sm:text-sm leading-relaxed cursor-pointer transition-all duration-200 ${
                                          !expandedDescriptions.has(title.id) 
                                            ? 'line-clamp-3' 
                                            : ''
                                        }`}
                                        onClick={() => handleCopy(title.description, 'description', title.id)}
                                        title="Click to copy description"
                                      >
                                        {title.description}
                                      </p>
                                      
                                      {/* Expand/Collapse button for long descriptions */}
                                      {title.description.length > 150 && (
                                        <button
                                          onClick={() => toggleDescriptionExpansion(title.id)}
                                          className="mt-2 text-xs text-teal-600 hover:text-teal-800 flex items-center transition-colors"
                                        >
                                          {expandedDescriptions.has(title.id) ? (
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
                                    onClick={() => handleCopy(title.description, 'description', title.id)}
                                    className="text-teal-500 hover:text-teal-700 ml-2 p-1 flex-shrink-0"
                                    title="Copy description"
                                  >
                                    {copiedStates.description === title.id ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Keywords Section */}
                            {title.keywords && title.keywords.length > 0 && (
                              <div className="mb-4 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                <div className="flex flex-wrap gap-2 items-center">
                                  <div className="flex items-center mr-2">
                                    <Tag className="h-3.5 w-3.5 text-blue-600 mr-1" />
                                    <span className="text-xs font-medium text-blue-700">Keywords:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {title.keywords.map((keyword, kidx) => (
                                      <Badge
                                        key={kidx}
                                        variant="outline"
                                        className="bg-white/70 text-xs text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                                        onClick={() => handleCopyKeyword(keyword)}
                                        title={`Click to copy "${keyword}"`}
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="bg-white/80 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors ml-auto"
                                    onClick={() => handleCopy(title.keywords.join(', '), 'keywords', title.id)}
                                    title="Copy all keywords"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      {copiedStates.keywords === title.id ? 'Copied!' : 'Copy all'}
                                    </span>
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* Generation info with improved styling */}
                            {title.generation && (
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span>
                                      {format(
                                        new Date(title.generation.createdAt),
                                        "MMM d, yyyy 'at' h:mm a"
                                      )}
                                    </span>
                                  </div>
                                  {/* {title.generation.provider && (
                                    <Badge variant="outline" className="text-xs bg-white">
                                      {title.generation.provider}
                                    </Badge>
                                  )} */}
                                </div>
                                {title.generation.prompt && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <span className="font-medium text-gray-700">Original prompt: </span>
                                    <span className="italic">
                                      {title.generation.prompt.length > 100
                                        ? `${title.generation.prompt.substring(0, 100)}...`
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
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="text-sm text-gray-500 text-center sm:text-left">
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
                disabled={isLoading}
                className="flex items-center"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                onClick={onClose} 
                className="bg-teal-600 hover:bg-teal-700" 
                size="sm"
                disabled={isMutating}
              >
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