import { PrismaClient } from "@prisma/client";
// import langs from "langs"

import axios from "axios";

const prisma = new PrismaClient();

// Memory cache for API keys
let cachedKeys: string[] = [];
let currentKeyIndex = 0;

/**
 * Load API keys from DB.
 */
export async function loadKeysFromDB(): Promise<void> {
  try {
    const keysFromDB = await prisma.yT_KEYS.findMany();
    if (!keysFromDB.length) {
      throw new Error("No YT_KEYS found in the database.");
    }

    cachedKeys = keysFromDB.map((item) => item.key);
    currentKeyIndex = 0;
    console.log(
      `Loaded ${cachedKeys.length} YouTube API keys from the database.`
    );
  } catch (error) {
    console.error("Error loading API keys from DB:", error);
    throw error;
  }
}

/**
 * Get the next available API key.
 */
export function getNextApiKey(): string {
  if (cachedKeys.length === 0) {
    throw new Error("No YouTube API keys are loaded. Please load keys first.");
  }

  if (currentKeyIndex >= cachedKeys.length) {
    throw new Error(
      "All YouTube API keys have been used or reached their quota."
    );
  }

  const key = cachedKeys[currentKeyIndex];
  currentKeyIndex++;
  return key;
}

/**
 * Parses an ISO 8601 duration string into total seconds.
 */
function parseISO8601Duration(durationStr: string): number {
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

function prepareFeature(feature: any): string {
  return feature
    ? feature
        .toString()
        .replace(/[\n\r"]+/g, "")
        .trim()
    : "";
}
/**
 * Fetch latest videos using `order=date` and `publishedAfter`.
 */
const isEnglishTitle = (text: string): boolean => {
  // Common English patterns
  const englishPatterns = [
    /^[a-zA-Z0-9\s\-'".,!?()&|]+$/, // Basic English characters
    /\b(the|a|an)\s/i, // Articles
    /\b(in|on|at|by|for|with|to)\s/i, // Common prepositions
    /\b(is|are|was|were|will|can)\s/i, // Common verbs
  ];

  // Text must be at least 3 characters
  if (text.length < 3) return false;

  // Must match basic English character pattern
  if (!englishPatterns[0].test(text)) return false;

  // Should match at least one English language pattern
  return englishPatterns.slice(1).some((pattern) => pattern.test(text));
};
export async function fetchYouTubeData(pageToken: string | null) {
  let apiKey: string = "";

  while (true) {
    try {
      apiKey = getNextApiKey();
    } catch (err: any) {
      console.error("Error fetching API key:", err);
      if (
        err.message ===
        "All YouTube API keys have been used or reached their quota."
      ) {
        throw new Error(
          "All YouTube API keys have been used or reached their quota."
        );
      }
    }

    // Get latest video date to fetch only fresh videos
    const latestVideo = await prisma.video.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });

    // Fixed date for initial fetch from past
    const lastPublishedDate = latestVideo
      ? latestVideo.publishedAt.toISOString()
      : "1970-01-01T00:00:00Z"; // Fixed from future date to past date

    const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&type=video&maxResults=50&order=date&regionCode=PK&relevanceLanguage=en&publishedAfter=${lastPublishedDate}&key=${apiKey}`;

    try {
      const response = await axios.get(url);

      // Filter videos with English titles
      const filteredItems = response.data.items.filter((item: any) => {
        const title = item.snippet.title;
        return isEnglishTitle(title);
      });
      console.log(
        `Fetched ${filteredItems.length} videos (from ${response.data.items.length} results) using API key ${apiKey}`
      );

      return {
        ...response.data,
        items: filteredItems,
      };
    } catch (error: any) {
      const errorCode =
        error.response?.data?.error?.errors?.[0]?.reason || "unknown";

      if (errorCode === "quotaExceeded") {
        console.warn(
          `API Key ${apiKey} has exceeded its quota. Switching to next key.`
        );
      } else {
        console.error(
          "YouTube API Error:",
          error.response?.data || error.message
        );
        return null;
      }
    }
  }
}
/**
 * Fetch video details by video IDs to get `contentDetails` (duration).
 */
async function fetchVideoDetails(videoIds: string[]) {
  let apiKey: string;

  while (true) {
    try {
      apiKey = getNextApiKey();
    } catch (err) {
      console.error("Error fetching API key:", err);
      return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds.join(
      ","
    )}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      return response.data.items;
    } catch (error: any) {
      console.error(
        "Failed to fetch video details:",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

/**
 * Save new videos to the database (no updates).
 */
export async function saveVideosToDB(
  videos: any[],
  pageToken: string | null
): Promise<number> {
  let savedCount = 0;

  // Extract video IDs to fetch full details
  const videoIds = videos.map((video) => video.id.videoId);
  const videoDetails = await fetchVideoDetails(videoIds);

  if (!videoDetails) {
    console.error("Failed to fetch video details. Skipping batch.");
    return 0;
  }

  for (const video of videoDetails) {
    if (!video.statistics) {
      console.warn(`Video ${video.id} lacks statistics. Skipping.`);
      continue;
    }

    const durationSeconds = parseISO8601Duration(
      video.contentDetails?.duration || ""
    );
    if (durationSeconds <= 60) {
      console.log(
        `Skipping SHORT video: ${video.id} (Duration: ${durationSeconds}s)`
      );
      continue;
    }

    const categoryExists = await prisma.category.findUnique({
      where: { categoryId: video.snippet.categoryId },
    });

    if (!categoryExists) {
      console.log(
        `Skipping video ${video.id} — category ${video.snippet.categoryId} not found.`
      );
      continue;
    }

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { videoId: video.id },
    });
    if (existingVideo) {
      console.log(`Video ${video.id} already exists. Skipping.`);
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
      viewCount: parseInt(video.statistics.viewCount || "0", 10),
      likes: parseInt(video.statistics.likeCount || "0", 10),
      dislikes: parseInt(video.statistics.dislikeCount || "0", 10),
      commentCount: parseInt(video.statistics.commentCount || "0", 10),
      thumbnailLink: video.snippet.thumbnails?.default?.url || "",
      commentsDisabled: !video.statistics.commentCount,
      ratingsDisabled: !video.statistics.likeCount,
      description: prepareFeature(video.snippet.description),
      countryCode: "PK",
      pageToken,
      category: { connect: { categoryId: categoryExists.categoryId } },
    };

    try {
      await prisma.video.create({ data });
      console.log(`Inserted new video: ${data.videoId}`);
      savedCount++;
    } catch (err) {
      console.error(`Failed to insert video ${data.videoId}:`, err);
    }
  }

  return savedCount;
}

/**
 * Main function to orchestrate the scraping process.
 */
export async function scrapeYouTubeData() {
  try {
    await loadKeysFromDB();

    let pageToken: string | null = null;

    while (true) {
      const data = await fetchYouTubeData(pageToken);
      if (!data || !data.items) {
        console.error("No data received from YouTube API.");
        return null;
      }

      const savedVideos = await saveVideosToDB(data.items, data.nextPageToken);

      if (savedVideos > 0) {
        console.log("Scraping completed successfully.");
        return data.nextPageToken;
      } else {
        console.warn("No new videos were saved. Fetching next batch...");
        pageToken = data.nextPageToken;
      }
    }
  } catch (error: any) {
    console.error("An error occurred during scraping:", error);
    throw new Error(error.message);
  }
}
