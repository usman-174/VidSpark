import { PrismaClient } from "@prisma/client";
import { franc } from "franc";
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

      // Filter videos with English or Urdu titles
      const filteredItems = response.data.items.filter((item: any) => {
        const title = item.snippet.title;
        // Detect language with minimum confidence
        const resultLang = franc(title, { minLength: 3 });
        const allowedLangs = ["eng", "urd"];
        return allowedLangs.includes(resultLang);
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
 * Scrape YouTube video details using Video ID
 */
export async function scrapeYouTubeVideo(videoId: string) {
  let apiKey: string = "";

  while (true) {
    try {
      apiKey = getNextApiKey();
    } catch (err: any) {
      console.error("Error fetching API key:", err);
      throw new Error("All YouTube API keys have been used or reached their quota.");
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      if (!response.data.items.length) {
        throw new Error("No video found for the given ID.");
      }

      const videoData = response.data.items[0];

      return {
        title: prepareFeature(videoData.snippet.title),
        description: prepareFeature(videoData.snippet.description),
        channelTitle: prepareFeature(videoData.snippet.channelTitle),
        publishedAt: videoData.snippet.publishedAt,
        duration: parseISO8601Duration(videoData.contentDetails.duration),
        viewCount: parseInt(videoData.statistics.viewCount || "0", 10),
        likeCount: parseInt(videoData.statistics.likeCount || "0", 10),
        commentCount: parseInt(videoData.statistics.commentCount || "0", 10),
      };
    } catch (error: any) {
      const errorCode =
        error.response?.data?.error?.errors?.[0]?.reason || "unknown";

      if (errorCode === "quotaExceeded") {
        console.warn(`API Key ${apiKey} has exceeded its quota. Switching to next key.`);
      } else {
        console.error("YouTube API Error:", error.response?.data || error.message);
        return null;
      }
    }
  }
}
