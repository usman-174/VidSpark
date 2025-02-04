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
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";

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

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const YTVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    totalVideos: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const fetchVideos = async (pageNumber: number, pageSize: number) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/videos?page=${pageNumber}&limit=${pageSize}`);
      setVideos(data.videos);
      setMetadata(data.metadata);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data.error || "Failed to fetch videos");
      toast.error(err.response?.data.error || "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(page, limit);
  }, [page, limit]);

  const handleDelete = async (videoId: string) => {
    try {
      await axios.delete(`/videos/${videoId}`);
      toast.success("Video deleted successfully");
      fetchVideos(page, limit);
    } catch (err) {
      toast.error("Failed to delete video");
    }
  };

  const handleScrape = async () => {
    try {
      setLoading(true);
      await axios.post("/videos/scrape");
      toast.success("Videos scraped successfully");
      fetchVideos(page, limit);
    } catch (err: any) {
      toast.error(err.response?.data.error || "Failed to scrape videos");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePageChange = (selectedItem: { selected: number }) => {
    const newPage = selectedItem.selected + 1;
    setSearchParams({ page: newPage.toString(), limit: limit.toString() });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setSearchParams({ page: "1", limit: newLimit.toString() });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Videos</h2>
        <Button onClick={handleScrape} disabled={loading}>
          {loading ? "Scraping..." : "Scrape Videos"}
        </Button>
      </div>

      {loading && !videos.length ? (
        <p className="text-center">Loading videos...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : videos.length === 0 ? (
        <p className="text-center">No videos available.</p>
      ) : (
        <>
          <div className="flex items-center justify-end space-x-2">
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
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {metadata.currentPage} of {metadata.totalPages} pages
              (Total {metadata.totalVideos} videos)
            </p>
          </div>
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
        </>
      )}

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
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {metadata.totalPages}
          </p>
        </div>
      )}
    </div>
  );
};

export default YTVideos;