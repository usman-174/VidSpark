import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactPaginate from "react-paginate";
import { useSearchParams } from "react-router-dom";

import { videosAPI } from "@/api/videoApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function YTVideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["videos", page, limit],
    queryFn: () => videosAPI.getVideos({ page, limit }),
  });

  const deleteMutation = useMutation({
    mutationFn: videosAPI.deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: "Video deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: videosAPI.scrapeVideos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({ title: "Videos scraped successfully" });
    },
    onError: (error: any) => {
      toast({
        title: error.response?.data.error || "Failed to scrape videos",
        variant: "destructive",
      });
    },
  });

  const handlePageChange = ({ selected }: { selected: number }) => {
    setSearchParams({
      page: (selected + 1).toString(),
      limit: limit.toString(),
    });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({
      page: "1",
      limit: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const { videos, metadata } = data || {
    videos: [],
    metadata: { totalVideos: 0, currentPage: 1, totalPages: 1, pageSize: 10 },
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <Button
          onClick={() => scrapeMutation.mutate()}
          disabled={scrapeMutation.isPending}
        >
          {scrapeMutation.isPending ? "Scraping..." : "Scrape Videos"}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {metadata.currentPage} of {metadata.totalPages} pages (Total{" "}
          {metadata.totalVideos} videos)
        </p>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Items per page:</label>
          <select
            className="border rounded-md p-2"
            value={limit}
            onChange={handleLimitChange}
          >
            {ITEMS_PER_PAGE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Thumbnail</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Likes</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.videoId}>
              <TableCell>
                <img
                  src={video.thumbnailLink}
                  alt={video.title}
                  className="h-16 w-28 object-cover rounded-md"
                />
              </TableCell>
              <TableCell className="font-medium">{video.title}</TableCell>
              <TableCell>{video.channelTitle}</TableCell>
              <TableCell>
                {video.publishedAt
                  ? new Date(video.publishedAt).toLocaleDateString()
                  : "N/A"}
              </TableCell>
              <TableCell>{video.likes ?? 0}</TableCell>
              <TableCell>{video.commentCount ?? 0}</TableCell>
              <TableCell>{video.category?.title ?? "N/A"}</TableCell>
              <TableCell className="text-right">
                {video.viewCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(video.videoId)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    Watch
                  </Button>
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {metadata.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-3 pt-4">
          <ReactPaginate
            pageCount={metadata.totalPages}
            pageRangeDisplayed={5}
            marginPagesDisplayed={2}
            onPageChange={handlePageChange}
            containerClassName="flex space-x-2"
            activeClassName="bg-blue-500 text-white"
            pageClassName="px-3 py-1 border rounded"
            previousClassName="px-3 py-1 border rounded"
            nextClassName="px-3 py-1 border rounded"
            breakClassName="px-3 py-1 border rounded"
            disabledClassName="opacity-50 cursor-not-allowed"
            forcePage={page - 1}
          />
        </div>
      )}
    </div>
  );
}
