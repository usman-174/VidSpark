import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();
export const API_KEYS = [
  "AIzaSyAOw_8esdbm1cFXMT1MAetJc2m0vwp9374",
  //   process.env.YT_API_KEY_2,
  //   process.env.YT_API_KEY_3,
];

let apiKeyIndex = 0;

// Function to get the next available API key
function getNextApiKey(): string | null {
  if (apiKeyIndex >= API_KEYS.length) {
    throw new Error("All YouTube API keys have reached their quota.");
    // return null; // No more keys available
  }
  const key = API_KEYS[apiKeyIndex];
  apiKeyIndex++;
  return key!;
}
// Helper to parse ISO 8601 durations (e.g. "PT12M21S") into total seconds
function parseISO8601Duration(durationStr: string): number {
  const matches = durationStr.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!matches) return 0;

  const hours = (matches[1] || "0H").slice(0, -1);
  const minutes = (matches[2] || "0M").slice(0, -1);
  const seconds = (matches[3] || "0S").slice(0, -1);
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

// Fetch YouTube data with error handling
export async function fetchYouTubeData(pageToken: string | null) {
  let apiKey = getNextApiKey();
  if (!apiKey) return null;

  // Request contentDetails as well to filter out shorts
  const url = `https://www.googleapis.com/youtube/v3/videos?part=id,statistics,snippet,contentDetails&pageToken=${
    pageToken || ""
  }&chart=mostPopular&regionCode=PK&maxResults=50&key=${apiKey}`;

  while (apiKey) {
    try {
      const response = await axios.get(url);
      console.log("Fetching data of length", response.data.items.length);
      return response.data;
    } catch (error: any) {
      const errorCode =
        error.response?.data?.error?.errors?.[0]?.reason || "unknown";

      if (errorCode === "quotaExceeded") {
        console.warn(
          `API Key ${apiKey} has reached its quota. Trying next key...`
        );
        apiKey = getNextApiKey(); // Switch API key and retry
      } else {
        console.error(
          "YouTube API Error:",
          error.response?.data || error.message
        );
        return null;
      }
    }
  }

  return null;
}

// Function to sanitize feature values (remove newlines, quotes, etc.)
function prepareFeature(feature: any) {
  if (!feature) return "";
  return feature
    .toString()
    .replace(/[\n\r"]+/g, "")
    .trim();
}

// Save videos to DB, skipping shorts (<= 60s) and missing categories
export async function saveVideosToDB(videos: any[], pageToken: string | null) {
  for (const video of videos) {
    // Must have statistics
    if (!video.statistics) continue;

    // Parse duration to skip Shorts
    const durationSeconds = parseISO8601Duration(
      video.contentDetails?.duration || ""
    );
    // If duration is 60s or less, treat it as a Short; skip
    if (!durationSeconds || durationSeconds <= 60) {
      console.log(`Skipping SHORT video: ${video.id}`);
      continue;
    }

    // Check if category exists in DB
    const categoryExists = await prisma.category.findUnique({
      where: { categoryId: video.snippet.categoryId },
    });

    if (!categoryExists) {
      console.log(
        `Skipping video ${video.id} — category ${video.snippet.categoryId} not found.`
      );
      continue;
    }

    const data = {
      videoId: video.id,
      title: prepareFeature(video.snippet.title),
      publishedAt: new Date(video.snippet.publishedAt),
      channelId: video.snippet.channelId,
      channelTitle: prepareFeature(video.snippet.channelTitle),
      trendingDate: new Date(),
      tags: video.snippet.tags?.join("|") || "[none]",
      viewCount: parseInt(video.statistics.viewCount || "0"),
      likes: parseInt(video.statistics.likeCount || "0"),
      dislikes: parseInt(video.statistics.dislikeCount || "0"),
      commentCount: parseInt(video.statistics.commentCount || "0"),
      thumbnailLink: video.snippet.thumbnails?.default?.url || "",
      commentsDisabled: !video.statistics.commentCount,
      ratingsDisabled: !video.statistics.likeCount,
      description: prepareFeature(video.snippet.description),
      countryCode: "PK",
      pageToken,
      // Connect by the YT categoryId field
      category: {
        connect: {
          categoryId: categoryExists.categoryId,
        },
      },
    };

    await prisma.video.upsert({
      where: { videoId: data.videoId },
      update: data,
      create: data,
    });
  }
}

// Main function to scrape YouTube trending videos
export async function scrapeYouTubeData() {
  // Fetch the last stored pageToken
  const lastRecord = await prisma.video.findFirst({
    orderBy: { trendingDate: "desc" },
    select: { pageToken: true },
  });

  let pageToken = lastRecord?.pageToken || null;
  const data = await fetchYouTubeData(pageToken);
  if (!data || !data.items) return null;

  const lastSavedVideo = await saveVideosToDB(data.items, data.nextPageToken);
  return lastSavedVideo;
}
