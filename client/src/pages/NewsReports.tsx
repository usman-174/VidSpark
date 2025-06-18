import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper } from "lucide-react";

interface NewsIdea {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
}

const NewsReports = () => {
  const [newsIdeas, setNewsIdeas] = useState<NewsIdea[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    const fetchNewsIdeas = async () => {
      try {
        setNewsLoading(true);
        const response = await axiosInstance.get("/news-ideas");
        setNewsIdeas(response.data.news || []);
      } catch (error) {
        console.error("Error fetching news ideas:", error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNewsIdeas();
  }, []);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Newspaper className="mr-2 h-5 w-5 text-indigo-500" />
          News Ideas
        </CardTitle>
        <CardDescription>Fresh daily ideas from news headlines</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4 space-y-2">
          {newsLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))
          ) : newsIdeas.length === 0 ? (
            <p className="text-gray-600 text-sm">No news available.</p>
          ) : (
            newsIdeas.map((news) => (
              <a
                key={news.id}
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:underline"
              >
                {news.title}
              </a>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsReports;
