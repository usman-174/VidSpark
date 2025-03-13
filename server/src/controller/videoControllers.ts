import { Request, Response } from "express";
import { initializeDependencies } from "../utils/dependencies";
import * as youtubeService from "../services/ytService";
import { getNextApiKey, loadKeysFromDB } from "../scripts/YTscraper";
import axios from "axios";
import { TfIdf } from "natural";

import vader from "vader-sentiment";
import { deductCredits } from "../services/userService";

export const analyzeVideoSentiment = async (req: Request, res: Response) :Promise<any> => {
  try {
    await loadKeysFromDB();
    const { videoId } = req.query;
    const { user } = res.locals;

    if (!videoId) {
      return res.status(400).json({ error: "Missing video ID." });
    }

    // Get video details to include title in response
    const YOUTUBE_API_KEY = getNextApiKey();
    const YOUTUBE_VIDEO_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const videoResponse = await axios.get(YOUTUBE_VIDEO_URL);
    const videoTitle = videoResponse.data.items[0]?.snippet?.title || "";

    // Get comments
    const YOUTUBE_COMMENTS_URL = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=400&key=${YOUTUBE_API_KEY}`;
    const response = await axios.get(YOUTUBE_COMMENTS_URL);

    // Extract comments but filter out those containing links
    const allComments = response.data.items.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    );

    // Regular expression to detect URLs in text
    const urlRegex =
      /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;

    // Filter out comments with links
    const comments = allComments.filter((comment) => !urlRegex.test(comment));

    console.log(
      `Filtered ${
        allComments.length - comments.length
      } comments with links out of ${allComments.length} total comments`
    );

    if (!comments.length) {
      return res
        .status(404)
        .json({ error: "No valid comments found after filtering." });
    }

    // Configuration for neutral bias reduction
    const NEUTRAL_THRESHOLD = 0.05; // Threshold to determine what's "barely" neutral
    const NEUTRAL_REDISTRIBUTION_FACTOR = 0.7; // How much to redistribute (0-1)

    // Process sentiment for each comment
    const sentimentScores = comments.map((comment: string) => {
      const sentimentResult =
        vader.SentimentIntensityAnalyzer.polarity_scores(comment);

      // Determine sentiment category with the bias adjustment
      let sentiment: "positive" | "negative" | "neutral";

      if (sentimentResult.neu > 0.5) {
        // If it's primarily neutral
        // Calculate difference between positive and negative
        const posnegDiff = Math.abs(sentimentResult.pos - sentimentResult.neg);

        if (posnegDiff >= NEUTRAL_THRESHOLD) {
          // If there's a meaningful difference, lean toward that direction
          sentiment =
            sentimentResult.pos > sentimentResult.neg ? "positive" : "negative";

          // Adjust scores - reduce neutrality and boost the dominant sentiment
          const adjustment =
            sentimentResult.neu * NEUTRAL_REDISTRIBUTION_FACTOR;
          sentimentResult.neu -= adjustment;

          if (sentiment === "positive") {
            sentimentResult.pos += adjustment;
          } else {
            sentimentResult.neg += adjustment;
          }
        } else {
          sentiment = "neutral";
        }
      } else {
        // For comments that aren't primarily neutral, use standard classification
        sentiment =
          sentimentResult.compound >= 0.05
            ? "positive"
            : sentimentResult.compound <= -0.05
            ? "negative"
            : "neutral";
      }

      return {
        comment,
        ...sentimentResult,
        sentiment,
      };
    });

    // Calculate overall sentiment with the adjusted scores
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

    // Get some representative comment examples for each sentiment

    // Add stats about filtered comments
    const stats = {
      totalCommentsReceived: allComments.length,
      commentsWithLinks: allComments.length - comments.length,
      commentsAnalyzed: comments.length,
    };

    await deductCredits(user.userId, 1);

    res.status(200).json({
      overallSentiment,
      sentimentScores,
      videoTitle,

      stats,
    });
  } catch (error) {
    console.error(
      "Error analyzing sentiment:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to analyze sentiment.",
      message: error.response?.data?.error?.message || error.message,
    });
  }
};
// Helper function to get representative comment examples for each sentiment

// Cache object and duration (in milliseconds)
let trendingVideosCache: {
  videos: any[];
  topKeywords: any[];
  cachedAt: number;
} | null = null;
const CACHE_DURATION = 5; // 5 minutes
function isEnglish(text: string): boolean {
  if (!text || text.trim().length < 5) {
    return true; // Assume very short texts are English.
  }
  const trimmed = text.trim();
  const asciiChars = trimmed.match(/[\x00-\x7F]/g) || [];
  const asciiRatio = asciiChars.length / trimmed.length;
  return asciiRatio >= 0.8;
}

export const getTrendingVideos = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Check if cache exists and is still valid.
    if (
      trendingVideosCache &&
      Date.now() - trendingVideosCache.cachedAt < CACHE_DURATION
    ) {
      console.log("Returning cached trending videos");
      return res.status(200).json(trendingVideosCache);
    }

    // Load API keys and dependencies.
    await loadKeysFromDB();
    const { axios } = await initializeDependencies();

    // Fetch the next available YouTube API key from DB.
    const YOUTUBE_API_KEY = getNextApiKey();
    const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=PK&maxResults=50&key=${YOUTUBE_API_KEY}`;

    const response = await axios.get(YOUTUBE_API_URL);
    let videos = response.data.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      views: video.statistics.viewCount,
      likes: video.statistics.likeCount,
      channelTitle: video.snippet.channelTitle,
      snippet: video.snippet,
    }));

    // Filter videos to only include those with English titles using our custom isEnglish function.
    videos = videos.filter((video) => isEnglish(video.title));

    // If no videos remain after filtering, return empty arrays.
    if (videos.length === 0) {
      return res.status(200).json({ videos: [], topKeywords: [] });
    }

    // Initialize TF-IDF and add each video's title and description as a document.
    const tfidf = new TfIdf();
    videos.forEach((video) => {
      const text = `${video.title} ${video.description}`;
      const cleanedText = text.toLowerCase().replace(/[^\w\s]/gi, "");
      tfidf.addDocument(cleanedText);
    });

    // Aggregate keywords across all videos by summing TF-IDF scores.
    const aggregatedKeywords: { [term: string]: number } = {};
    for (let i = 0; i < videos.length; i++) {
      const terms = tfidf.listTerms(i).filter((item) => item.term.length > 2);
      terms.forEach((item) => {
        aggregatedKeywords[item.term] =
          (aggregatedKeywords[item.term] || 0) + item.tfidf;
      });
    }

    // Convert the aggregated keywords into an array and sort by score (highest first).
    const aggregatedKeywordsArray = Object.keys(aggregatedKeywords).map(
      (term) => ({
        term,
        score: aggregatedKeywords[term],
      })
    );
    aggregatedKeywordsArray.sort((a, b) => b.score - a.score);

    // Pick the top 10 keywords.
    const topKeywords = aggregatedKeywordsArray.slice(0, 10);
    console.log("Top Keywords:", topKeywords);

    // Cache the response along with the current timestamp.
    trendingVideosCache = {
      videos,
      topKeywords,
      cachedAt: Date.now(),
    };

    res.status(200).json(trendingVideosCache);
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
