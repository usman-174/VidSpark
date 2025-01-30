import React, { useState, useEffect } from "react";
import axios from "@/api/axiosInstance";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailLink: string;
  viewCount: number;
  likes?: number;
  commentCount?: number;
  publishedAt?: string; // or Date, depending on your response
  category?: {
    title: string;
  };
}

const YTVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch videos with pagination
  const fetchVideos = async (pageNumber: number) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/videos?page=${pageNumber}&limit=10`);
      setVideos(data.videos);
      setTotalPages(data.metadata.totalPages);
      setError(null);
    } catch (err: any) {
       
        
      setError(err.response?.data.error || "Failed to fetch videos");
      toast.error(err.response?.data.error || "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Delete a video
  const handleDelete = async (videoId: string) => {
    try {
      await axios.delete(`/videos/${videoId}`);
      toast.success("Video deleted successfully");
      // Refresh current page
      fetchVideos(page);
    } catch (err) {
      toast.error("Failed to delete video");
    }
  };

  // Scrape new videos
  const handleScrape = async () => {
    try {
      setLoading(true);
      await axios.post("/videos/scrape");
      toast.success("Videos scraped successfully");
      // Re-fetch current page after scraping
      fetchVideos(page);
    } catch (err:any) {
      toast.error(err.response?.data.error || "Failed to scrape videos");
    } finally {
      setLoading(false);
    }
  };

  // Convert published date to a readable string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header & Scrape button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <Button onClick={handleScrape} disabled={loading}>
          {loading ? "Scraping..." : "Scrape Videos"}
        </Button>
      </div>

      {/* Main Content Area */}
      {loading && !videos.length ? (
        <p className="text-center">Loading videos...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : videos.length === 0 ? (
        <p className="text-center">No videos available.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Thumbnail</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Published At</TableHead>
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
                <TableCell>{formatDate(video.publishedAt)}</TableCell>
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
                    onClick={() => handleDelete(video.videoId)}
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
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-3 pt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              First
            </Button>
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <span className="mx-2 text-sm font-semibold">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              Last
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
};

export default YTVideos;
