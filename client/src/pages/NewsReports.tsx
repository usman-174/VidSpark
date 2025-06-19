import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper } from "lucide-react";

interface NewsIdea {
  id: string;
  title: string;
  link: string;
  pubDate: string;
}

const NewsReports = () => {
  const [newsIdeas, setNewsIdeas] = useState<NewsIdea[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0] // default to today
  );

  useEffect(() => {
    const fetchNewsIdeas = async () => {
      try {
        setNewsLoading(true);
        const response = await axiosInstance.get("/news/show", {
          params: { date: selectedDate }, // e.g., 2025-06-19
        });
        console.log("News API response:", response.data);
        setNewsIdeas(response.data.news || []);
      } catch (error) {
        console.error("Error fetching news ideas:", error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNewsIdeas();
  }, [selectedDate]);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Newspaper className="mr-2 h-5 w-5 text-indigo-500" />
          News Ideas
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          Fresh daily ideas from news headlines
          <input
            type="date"
            className="w-fit border rounded p-1 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4 space-y-2">
          {newsLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))
          ) : newsIdeas.length === 0 ? (
            <p className="text-gray-600 text-sm">No news available for this date.</p>
          ) : (
            newsIdeas.map((news) => (
              <div key={news.id} className="text-sm space-y-1">
                <a
                  href={news.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  {news.title}
                </a>
                <p className="text-gray-500 text-xs">
                  {new Date(news.pubDate).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsReports;
