import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

// Memory cache for the API keys
let cachedKeys: string[] = [];
let currentKeyIndex = 0;

/**
 * Load all API keys from the YT_KEYS table into memory.
 * Should be called once at the start of the application.
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
    throw error; // Re-throw to handle it upstream if necessary
  }
}

/**
 * Retrieves the next available API key.
 * Throws an error if all keys have been exhausted.
 */
export function getNextApiKey(): string {
  if (cachedKeys.length === 0) {
    throw new Error(
      "No YouTube API keys are loaded in memory. Please load keys first."
    );
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
 * Example: "PT1H2M3S" => 3723 seconds
 */
function parseISO8601Duration(durationStr: string): number {
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!matches) return 0;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Sanitizes a string by removing newlines, quotes, and trimming whitespace.
 */
function prepareFeature(feature: any): string {
  if (!feature) return "";
  return feature
    .toString()
    .replace(/[\n\r"]+/g, "")
    .trim();
}

/**
 * Fetches YouTube data with API key rotation and error handling.
 * Excludes Shorts (videos <= 60 seconds).
 */
export async function fetchYouTubeData(pageToken: string | null) {
  let apiKey: string;

  while (true) {
    try {
      apiKey = getNextApiKey();
    } catch (err) {
      console.error("Error fetching API key:", err);
      return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=id,statistics,snippet,contentDetails&pageToken=${
      pageToken || ""
    }&chart=mostPopular&regionCode=PK&maxResults=50&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      console.log(
        `Fetched ${response.data.items.length} videos using API key ${apiKey}`
      );
      return response.data;
    } catch (error: any) {
      const errorCode =
        error.response?.data?.error?.errors?.[0]?.reason || "unknown";

      if (errorCode === "quotaExceeded") {
        console.warn(
          `API Key ${apiKey} has exceeded its quota. Attempting to use the next key.`
        );
        // Continue the loop to try the next key
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
 * Saves fetched videos to the database, excluding Shorts and ensuring categories exist.
 */
export async function saveVideosToDB(videos: any[], pageToken: string | null) {
  for (const video of videos) {
    // Ensure the video has necessary statistics
    if (!video.statistics) {
      console.warn(`Video ${video.id} lacks statistics. Skipping.`);
      continue;
    }

    // Parse duration to filter out Shorts (<= 60 seconds)
    const durationSeconds = parseISO8601Duration(
      video.contentDetails?.duration || ""
    );
    if (durationSeconds <= 60) {
      console.log(
        `Skipping SHORT video: ${video.id} (Duration: ${durationSeconds}s)`
      );
      continue;
    }

    // Check if the category exists in the database
    const categoryExists = await prisma.category.findUnique({
      where: { categoryId: video.snippet.categoryId },
    });

    if (!categoryExists) {
      console.log(
        `Skipping video ${video.id} — category ${video.snippet.categoryId} not found.`
      );
      continue;
    }

    // Prepare the data object for upsert
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
      // Connect the video to its category using categoryId
      category: {
        connect: {
          categoryId: categoryExists.categoryId,
        },
      },
    };

    try {
      await prisma.video.upsert({
        where: { videoId: data.videoId },
        update: data,
        create: data,
      });
      console.log(`Upserted video: ${data.videoId}`);
    } catch (err) {
      console.error(`Failed to upsert video ${data.videoId}:`, err);
    }
  }
}

/**
 * Main function to orchestrate the scraping process.
 */
export async function scrapeYouTubeData() {
  try {
    // Step 1: Load API keys from the database
    await loadKeysFromDB();

    // Step 2: Retrieve the last stored pageToken to continue fetching
    const lastRecord = await prisma.video.findFirst({
      orderBy: { trendingDate: "desc" },
      select: { pageToken: true },
    });

    let pageToken = lastRecord?.pageToken || null;

    // Step 3: Fetch YouTube data
    const data = await fetchYouTubeData(pageToken);
    if (!data || !data.items) {
      console.error("No data received from YouTube API.");
      return null;
    }

    // Step 4: Save the fetched videos to the database
    await saveVideosToDB(data.items, data.nextPageToken);

    console.log("Scraping completed successfully.");
    return data.nextPageToken;
  } catch (error) {
    console.error("An error occurred during scraping:", error);
    return null;
  }
}
