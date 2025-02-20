import { Request, Response } from "express";
import { initializeDependencies } from "../utils/dependencies";
import * as youtubeService from "../services/ytService";
import { getNextApiKey, loadKeysFromDB } from "../scripts/YTscraper";
import axios from "axios";

import vader from "vader-sentiment";


export const analyzeVideoSentiment = async (req: Request, res: Response) => {
  try {
  await    loadKeysFromDB();
    const { videoId } = req.query;
    // console.log("params", req.query);
    
    if (!videoId) {
      res.status(400).json({ error: "Missing video ID." });
    }
    console.log("after video");

    const YOUTUBE_API_KEY = getNextApiKey();
    const YOUTUBE_COMMENTS_URL = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${YOUTUBE_API_KEY}`;

    const response = await axios.get(YOUTUBE_COMMENTS_URL);
    console.log("after video");
    
    const comments = response.data.items.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    );

    if (!comments.length) {
      res.status(404).json({ error: "No comments found." });
    }

    const sentimentScores = comments.map((comment) => {
      const sentimentResult = vader.SentimentIntensityAnalyzer.polarity_scores(
        comment
      );
      
      return {
        comment,
        ...sentimentResult,
      };
    });

    const overallSentiment = sentimentScores.reduce(
      (acc, curr) => {
        acc.positive += curr.pos;
        acc.neutral += curr.neu;
        acc.negative += curr.neg;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const total = sentimentScores.length;
    overallSentiment.positive /= total;
    overallSentiment.neutral /= total;
    overallSentiment.negative /= total;

    res.status(200).json({ overallSentiment, sentimentScores });
  } catch (error) {
    console.error("Error analyzing sentiment:", error.response.data);
    res.status(500).json({ error: "Failed to analyze sentiment." });
  }
};


export const getTrendingVideos = async (req: Request, res: Response) => {
  try {
    loadKeysFromDB()
    const { prisma, axios } = await initializeDependencies();

    // Fetch the next available YouTube API key from DB
    const YOUTUBE_API_KEY = getNextApiKey();
    const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=PK&maxResults=10&key=${YOUTUBE_API_KEY}`;

    const response = await axios.get(YOUTUBE_API_URL);
    const videos = response.data.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      views: video.statistics.viewCount,
      likes: video.statistics.likeCount,
      channelTitle: video.snippet.channelTitle,
      snippet: video.snippet
    }));

    res.status(200).json(videos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchAndStoreCategories = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const categories = await youtubeService.fetchCategories();
    res
      .status(200)
      .json({ message: "Categories populated successfully!", categories });
  } catch (error: any) {
    console.error(
      "Error fetching YouTube categories:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: "Failed to fetch and store YouTube categories" });
  }
};

export const scrapeVideos = async (req: Request, res: Response) => {
  try {
    await youtubeService.scrapeYouTubeVideos();
    res.status(200).json({ message: "Scraping complete" });
  } catch (error: any) {
    console.log("Error scraping videos:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limitOptions = [10, 20, 50, 100];
    const limit = limitOptions.includes(parseInt(req.query.limit as string))
      ? parseInt(req.query.limit as string)
      : 10;

    const result = await youtubeService.getVideoPaginated(page, limit);

    res.status(200).json({
      success: true,
      metadata: {
        totalVideos: result.totalVideos,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        pageSize: result.pageSize,
      },
      videos: result.videos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVideoById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { prisma } = await initializeDependencies();
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
    });
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createVideo = async (req: Request, res: Response) => {
  try {
    const { prisma } = await initializeDependencies();
    const video = await prisma.video.create({
      data: req.body,
    });
    res.status(201).json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { prisma } = await initializeDependencies();
    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.status(200).json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { prisma } = await initializeDependencies();
    await prisma.video.delete({
      where: { videoId: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.log("Error deleting video:", error.message);
    res.status(500).json({ error: error.message });
  }
};
