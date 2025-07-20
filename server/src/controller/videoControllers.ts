import axios from "axios";
import { Request, Response } from "express";
import { TfIdf } from "natural";
import { getNextApiKey, loadKeysFromDB } from "../scripts/YTscraper";
import {  trackFeatureUsage, updateFavoriteFeature } from "../services/statsService";
import { deductCredits } from "../services/userService";
import * as youtubeService from "../services/ytService";
import { initializeDependencies } from "../utils/dependencies";
import { FeatureType } from "@prisma/client";

const PYTHON_API_BASE_URL = process.env.PYTHON_API_URL || "http://localhost:7000";

// Data preprocessing utilities
const cleanText = (text: string): string => {
  if (!text) return "";

  return text
    // Remove URLs
    .replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi, '')
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove excessive whitespace and newlines
    .replace(/\s+/g, ' ')
    // Remove special characters but keep basic punctuation
    .replace(/[^\w\s.,!?;:'"()-]/g, '')
    // Remove excessive punctuation
    .replace(/[.]{2,}/g, '.')
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    // Trim whitespace
    .trim();
};

const preprocessTags = (tags: string[]): string => {
  if (!tags || tags.length === 0) return "";

  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0)
    .join(' ');
};

const isValidComment = (comment: string): boolean => {
  if (!comment || comment.length < 3) return false;

  // Filter out comments that are mostly emojis or special characters
  const alphanumericCount = (comment.match(/[a-zA-Z0-9]/g) || []).length;
  const totalLength = comment.length;

  // If less than 30% of the comment is alphanumeric, consider it invalid
  return (alphanumericCount / totalLength) >= 0.3;
};

const callPythonBatchSentimentAPI = async (texts: string[]): Promise<any> => {
  try {
    const response = await axios.post(`${PYTHON_API_BASE_URL}/batch-sentiment`, {
      texts: texts
    }, {
      timeout: 60000, // 60 second timeout for batch processing
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calling Python batch sentiment API:', error.message);
    throw new Error(`Batch sentiment analysis failed: ${error.message}`);
  }
};

export const analyzeVideoSentiment = async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();

  try {
    await loadKeysFromDB();
    const { prisma } = await initializeDependencies();
    const { videoId } = req.query;
    const { user } = res.locals;

    if (!videoId) {
      return res.status(400).json({ error: "Missing video ID." });
    }

    // Get video details
    const YOUTUBE_API_KEY = getNextApiKey();
    const YOUTUBE_VIDEO_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const videoResponse = await axios.get(YOUTUBE_VIDEO_URL);

    const videoData = videoResponse.data.items[0];
    if (!videoData) {
      return res.status(404).json({ error: "Video not found." });
    }

    const videoTitle = videoData.snippet?.title || "";
    const videoDescription = videoData.snippet?.description || "";
    const videoTags = videoData.snippet?.tags || [];

    // Clean video metadata
    const cleanTitle = cleanText(videoTitle);
    const cleanDescription = cleanText(videoDescription);
    const cleanTagsText = preprocessTags(videoTags);

    // Get comments
    const YOUTUBE_COMMENTS_URL = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=400&key=${YOUTUBE_API_KEY}`;
    const commentsResponse = await axios.get(YOUTUBE_COMMENTS_URL);

    // Extract and clean comments
    const allComments = commentsResponse.data.items.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    );

    // Filter and clean comments
    const validComments = allComments
      .map(comment => cleanText(comment))
      .filter(comment => isValidComment(comment));

    console.log(`Processed ${allComments.length} comments, ${validComments.length} valid after cleaning`);

    if (!validComments.length) {
      return res.status(404).json({
        error: "No valid comments found after preprocessing.",
        stats: {
          totalCommentsReceived: allComments.length,
          validCommentsAfterCleaning: 0
        }
      });
    }

    // Prepare data for Python API sentiment analysis
    const metadataTexts = [];
    const metadataLabels = [];

    // Add video metadata for analysis
    if (cleanTitle) {
      metadataTexts.push(cleanTitle);
      metadataLabels.push('title');
    }
    if (cleanDescription) {
      metadataTexts.push(cleanDescription);
      metadataLabels.push('description');
    }
    if (cleanTagsText) {
      metadataTexts.push(cleanTagsText);
      metadataLabels.push('tags');
    }

    // Analyze sentiment for video metadata using Python API
    console.log('Analyzing metadata sentiment...');
    const metadataSentimentResponse = await callPythonBatchSentimentAPI(metadataTexts);
    const metadataSentiments = metadataSentimentResponse.results || [];

    // Create metadata sentiment object
    const videoMetadata: any = {
      title: {
        original: videoTitle,
        cleaned: cleanTitle,
        sentiment: null
      },
      description: {
        original: videoDescription.substring(0, 200) + (videoDescription.length > 200 ? "..." : ""),
        cleaned: cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? "..." : ""),
        sentiment: null
      },
      tags: {
        original: videoTags,
        processed: cleanTagsText,
        sentiment: null
      }
    };

    // Map sentiment results to metadata
    metadataSentiments.forEach((sentiment: any, index: number) => {
      const label = metadataLabels[index];
      if (label === 'title') {
        videoMetadata.title.sentiment = sentiment;
      } else if (label === 'description') {
        videoMetadata.description.sentiment = sentiment;
      } else if (label === 'tags') {
        videoMetadata.tags.sentiment = sentiment;
      }
    });

    // Analyze sentiment for comments using Python API (batch processing)
    console.log('Analyzing comments sentiment...');
    const commentsBatchSize = 100;
    const commentSentimentScores = [];

    for (let i = 0; i < validComments.length; i += commentsBatchSize) {
      const batch = validComments.slice(i, i + commentsBatchSize);
      const batchResponse = await callPythonBatchSentimentAPI(batch);
      const batchResults = batchResponse.results || [];

      batch.forEach((comment, index) => {
        if (batchResults[index]) {
          commentSentimentScores.push({
            comment: comment,
            sentiment: batchResults[index].sentiment,
            confidence: batchResults[index].confidence || 0,
            scores: batchResults[index].scores || {}
          });
        }
      });
    }

    // Calculate overall sentiment from comments
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    commentSentimentScores.forEach(item => {
      sentimentCounts[item.sentiment as keyof typeof sentimentCounts]++;
    });

    const total = commentSentimentScores.length;
    const overallCommentSentiment = {
      positive: sentimentCounts.positive / total,
      neutral: sentimentCounts.neutral / total,
      negative: sentimentCounts.negative / total,
      totalAnalyzed: total,
      breakdown: sentimentCounts
    };

    // Calculate weighted overall sentiment
    const metadataWeight = 0.3;
    const commentsWeight = 0.7;

    const validMetadataSentiments = metadataSentiments.filter(s => s && s.sentiment);
    const metadataSentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    validMetadataSentiments.forEach(item => {
      metadataSentimentCounts[item.sentiment as keyof typeof metadataSentimentCounts]++;
    });

    const metadataTotal = validMetadataSentiments.length;
    const metadataAverageSentiment = metadataTotal > 0 ? {
      positive: metadataSentimentCounts.positive / metadataTotal,
      neutral: metadataSentimentCounts.neutral / metadataTotal,
      negative: metadataSentimentCounts.negative / metadataTotal
    } : { positive: 0, neutral: 1, negative: 0 };

    const weightedOverallSentiment = {
      positive: (metadataAverageSentiment.positive * metadataWeight) + (overallCommentSentiment.positive * commentsWeight),
      neutral: (metadataAverageSentiment.neutral * metadataWeight) + (overallCommentSentiment.neutral * commentsWeight),
      negative: (metadataAverageSentiment.negative * metadataWeight) + (overallCommentSentiment.negative * commentsWeight)
    };

    const overallSentimentLabel =
      weightedOverallSentiment.positive > weightedOverallSentiment.negative && weightedOverallSentiment.positive > weightedOverallSentiment.neutral ? 'positive' :
        weightedOverallSentiment.negative > weightedOverallSentiment.positive && weightedOverallSentiment.negative > weightedOverallSentiment.neutral ? 'negative' :
          'neutral';

    const stats = {
      totalCommentsReceived: allComments.length,
      invalidCommentsFiltered: allComments.length - validComments.length,
      validCommentsAnalyzed: validComments.length,
      titleLength: cleanTitle.length,
      descriptionLength: cleanDescription.length,
      tagsCount: videoTags.length,
      processingComplete: true,
      apiProvider: 'Python Transformers',
      processingTime: Date.now() - startTime
    };
    console.log("Sentiment analysis complete:", stats);

    // Save to sentimentalAnalysis table
    await prisma.sentimentalAnalysis.create({
      data: {
        userId: user.userId,
        videoId: videoId as string,
        positive: weightedOverallSentiment.positive,
        neutral: weightedOverallSentiment.neutral,
        negative: weightedOverallSentiment.negative,
      },
    });

    // Track feature usage
    await trackFeatureUsage(FeatureType.SENTIMENT_ANALYSIS, {
      userId: user.userId,
      videoId,
      totalCommentsAnalyzed: validComments.length,
      processingTime: stats.processingTime,
      success: true,
      titleLength: cleanTitle.length,
      descriptionLength: cleanDescription.length,
      tagsCount: videoTags.length
    });
    await updateFavoriteFeature(res.locals.user.userId)
    // Deduct credit
    await deductCredits(user.userId, 1);

    res.status(200).json({
      videoTitle,
      videoMetadata,
      commentsSentiment: {
        overall: overallCommentSentiment,
        individual: commentSentimentScores.slice(0, 10),
        totalAnalyzed: commentSentimentScores.length
      },
      weightedOverallSentiment: {
        ...weightedOverallSentiment,
        label: overallSentimentLabel
      },
      stats,
    });
  } catch (error: any) {
    console.error("Error analyzing sentiment:", error.response?.data || error.message);

    // Track failed feature usage
    await trackFeatureUsage(FeatureType.SENTIMENT_ANALYSIS, {
      userId: res.locals.user.userId,

      error: error.message,
      processingTime: Date.now() - startTime,
      success: false
    });

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
