import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Lightbulb, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Idea {
  id: string;
  title: string;
  originalNews: string;
  link: string;
  keywords: string[];
  pubDate: string;
  createdAt: string;
}

interface IdeasResponse {
  success: boolean;
  ideas: Idea[];
  count: number;
}

const IdeasOfTheDay = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: 'title' | 'keywords' | null }>({});

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get<IdeasResponse>("/ideas/show");
        console.log("Ideas API response:", data);

        setIdeas(data.ideas || []);
      } catch (error) {
        console.error("Error fetching ideas of the day:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const copyToClipboard = async (text: string, ideaId: string, type: 'title' | 'keywords') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [ideaId]: type }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [ideaId]: null }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text: ', error);
    }
  };

  const handleCopyTitle = (idea: Idea) => {
    copyToClipboard(idea.title, idea.id, 'title');
  };

  const handleCopyKeywords = (idea: Idea) => {
    const keywordsText = idea.keywords.join(', ');
    copyToClipboard(keywordsText, idea.id, 'keywords');
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="mr-2 h-5 w-5 text-orange-500" />
          Ideas of the Day
        </CardTitle>
        <CardDescription>
          Fresh YouTube video ideas for Pakistani audiences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[700px] pr-4 space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))
          ) : ideas.length === 0 ? (
            <p className="text-gray-600 text-sm">No ideas available for today.</p>
          ) : (
            ideas.map((idea) => (
              <div key={idea.id} className="text-sm space-y-2 border-b pb-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={idea.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold text-blue-600 hover:underline line-clamp-2 flex-1"
                  >
                    {idea.title}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyTitle(idea)}
                    className="h-6 w-6 p-0 shrink-0"
                    title="Copy title"
                  >
                    {copiedStates[idea.id] === 'title' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                <p className="text-gray-500 text-xs line-clamp-1">
                  Inspired by: {idea.originalNews}
                </p>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {idea.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyKeywords(idea)}
                    className="h-6 w-6 p-0 shrink-0"
                    title="Copy keywords"
                  >
                    {copiedStates[idea.id] === 'keywords' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                <p className="text-gray-500 text-xs">
                  {new Date(idea.pubDate).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default IdeasOfTheDay;