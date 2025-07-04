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
import { Lightbulb } from "lucide-react";
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
        <ScrollArea className="h-[300px] pr-4 space-y-4">
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
                <a
                  href={idea.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-semibold text-blue-600 hover:underline line-clamp-2"
                >
                  {idea.title}
                </a>
                <p className="text-gray-500 text-xs line-clamp-1">
                  Inspired by: {idea.originalNews}
                </p>
                <div className="flex flex-wrap gap-2">
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