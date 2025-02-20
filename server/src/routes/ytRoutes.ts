import express from "express";
import {
  analyzeVideoSentiment,
  createVideo,
  deleteVideo,
  fetchAndStoreCategories,
  getAllVideos,
  getTrendingVideos,
  getVideoById,
  scrapeVideos,
  updateVideo,
} from "../controller/videoControllers";



const ytRouter = express.Router();

// CRUD Routes
ytRouter.get("/trending", getTrendingVideos); 
ytRouter.get("/sentimental-analysis", analyzeVideoSentiment);
ytRouter.get("/", getAllVideos); // Get all videos (with pagination)
ytRouter.get("/:id", getVideoById); // Get a single video by ID
ytRouter.post("/", createVideo); // Create a new video (if needed)
ytRouter.put("/:id", updateVideo); // Update a video
ytRouter.delete("/:id", deleteVideo); // Delete a video
ytRouter.post("/categories", fetchAndStoreCategories); // Populate categories from YouTube API
ytRouter.post("/scrape", scrapeVideos);


export default ytRouter;
