import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import axios from "@/api/axiosInstance";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const YTVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
    const fetchVideos = async (pageNumber, pageSize) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/videos?page=${pageNumber}&limit=${pageSize}`);
            setVideos(data.videos);
            setMetadata(data.metadata);
            setError(null);
        }
        catch (err) {
            setError(err.response?.data.error || "Failed to fetch videos");
            toast.error(err.response?.data.error || "Failed to fetch videos");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchVideos(page, limit);
    }, [page, limit]);
    const handleDelete = async (videoId) => {
        try {
            await axios.delete(`/videos/${videoId}`);
            toast.success("Video deleted successfully");
            fetchVideos(page, limit);
        }
        catch (err) {
            toast.error("Failed to delete video");
        }
    };
    const handleScrape = async () => {
        try {
            setLoading(true);
            await axios.post("/videos/scrape");
            toast.success("Videos scraped successfully");
            fetchVideos(page, limit);
        }
        catch (err) {
            toast.error(err.response?.data.error || "Failed to scrape videos");
        }
        finally {
            setLoading(false);
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return "N/A";
        const dateObj = new Date(dateString);
        return dateObj.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };
    const handlePageChange = (selectedItem) => {
        const newPage = selectedItem.selected + 1;
        setSearchParams({ page: newPage.toString(), limit: limit.toString() });
    };
    const handleLimitChange = (e) => {
        const newLimit = Number(e.target.value);
        setSearchParams({ page: "1", limit: newLimit.toString() });
    };
    return (_jsxs("div", { className: "container mx-auto py-8 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold", children: "YouTube Videos" }), _jsx(Button, { onClick: handleScrape, disabled: loading, children: loading ? "Scraping..." : "Scrape Videos" })] }), loading && !videos.length ? (_jsx("p", { className: "text-center", children: "Loading videos..." })) : error ? (_jsx("p", { className: "text-center text-red-500", children: error })) : videos.length === 0 ? (_jsx("p", { className: "text-center", children: "No videos available." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Items per page:" }), _jsx("select", { className: "border rounded-md p-2", value: limit, onChange: handleLimitChange, children: ITEMS_PER_PAGE_OPTIONS.map((size) => (_jsx("option", { value: size, children: size }, size))) })] }), _jsx("div", { children: _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Showing ", metadata.currentPage, " of ", metadata.totalPages, " pages (Total ", metadata.totalVideos, " videos)"] }) }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[100px]", children: "Thumbnail" }), _jsx(TableHead, { children: "Title" }), _jsx(TableHead, { children: "Channel" }), _jsx(TableHead, { children: "Published At" }), _jsx(TableHead, { children: "Likes" }), _jsx(TableHead, { children: "Comments" }), _jsx(TableHead, { children: "Category" }), _jsx(TableHead, { className: "text-right", children: "Views" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: videos.map((video) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsx("img", { src: video.thumbnailLink, alt: video.title, className: "h-16 w-28 object-cover rounded-md" }) }), _jsx(TableCell, { className: "font-medium", children: video.title }), _jsx(TableCell, { children: video.channelTitle }), _jsx(TableCell, { children: formatDate(video.publishedAt) }), _jsx(TableCell, { children: video.likes ?? 0 }), _jsx(TableCell, { children: video.commentCount ?? 0 }), _jsx(TableCell, { children: video.category?.title ?? "N/A" }), _jsx(TableCell, { className: "text-right", children: video.viewCount.toLocaleString() }), _jsxs(TableCell, { className: "text-right space-x-2", children: [_jsx(Button, { variant: "destructive", size: "sm", onClick: () => handleDelete(video.videoId), children: "Delete" }), _jsx("a", { href: `https://www.youtube.com/watch?v=${video.videoId}`, target: "_blank", rel: "noopener noreferrer", children: _jsx(Button, { variant: "outline", size: "sm", children: "Watch" }) })] })] }, video.videoId))) })] })] })), metadata.totalPages > 1 && (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3 pt-4", children: [_jsx(ReactPaginate, { pageCount: metadata.totalPages, pageRangeDisplayed: 5, marginPagesDisplayed: 2, onPageChange: handlePageChange, containerClassName: "flex space-x-2", activeClassName: "bg-blue-500 text-white", pageClassName: "px-3 py-1 border rounded", previousClassName: "px-3 py-1 border rounded", nextClassName: "px-3 py-1 border rounded", breakClassName: "px-3 py-1 border rounded", disabledClassName: "opacity-50 cursor-not-allowed", forcePage: page - 1 }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Showing page ", page, " of ", metadata.totalPages] })] }))] }));
};
export default YTVideos;
