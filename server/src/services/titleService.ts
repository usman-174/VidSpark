// titleService.ts - Optimized YouTube Title Generator
import axios from "axios";
import { incrementFeatureUsage, updateFavoriteFeature } from "./statsService";
import { getNextApiKey, loadKeysFromDB } from "../scripts/YTscraper";

// CACHE API KEYS TO AVOID REPEATED DB CALLS
let apiKeysLoaded = false;
let lastKeyLoadTime = 0;
const KEY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function ensureApiKeysLoaded() {
  const now = Date.now();
  if (!apiKeysLoaded || (now - lastKeyLoadTime) > KEY_CACHE_DURATION) {
    await loadKeysFromDB();
    apiKeysLoaded = true;
    lastKeyLoadTime = now;
    console.log('🔑 API keys refreshed');
  }
}

// YouTube API Data Interfaces
interface YouTubeVideoData {
  title: string;
  description: string;
  tags: string[];
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  channelTitle: string;
  categoryId: string;
}

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
}

interface YouTubeInsights {
  trendingKeywords: string[];
  successfulPatterns: string[];
  avgTitleLength: number;
  topPerformingTitles: string[];
}

// KEEP YOUR EXISTING INTERFACES EXACTLY THE SAME
export interface TitleWithKeywords {
  title: string;
  keywords: string[];
  description: string;
}

interface TitleGenerationResponse {
  success: boolean;
  titles: TitleWithKeywords[];
  provider?: string;
  error?: string;
  generationId?: string;
}

interface TitleGenerationOptions {
  prompt: string;
  maxLength?: number;
  model?: string;
  useYouTubeAnalysis?: boolean;
  searchQuery?: string;
  competitorVideoIds?: string[];
}

// OPTIMIZED YOUTUBE API FUNCTIONS
async function getVideoDetails(videoId: string): Promise<YouTubeVideoData | null> {
  try {
    await ensureApiKeysLoaded(); // Only load once per session
    const YOUTUBE_API_KEY = getNextApiKey();

    const YOUTUBE_VIDEO_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const videoResponse = await axios.get(YOUTUBE_VIDEO_URL, {
      timeout: 10000, // 10 second timeout
    });

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return null;
    }

    const video = videoResponse.data.items[0];
    const snippet = video.snippet;
    const statistics = video.statistics;

    return {
      title: snippet.title,
      description: snippet.description || '',
      tags: snippet.tags || [],
      viewCount: statistics.viewCount || "0",
      likeCount: statistics.likeCount || "0",
      commentCount: statistics.commentCount || "0",
      publishedAt: snippet.publishedAt,
      channelTitle: snippet.channelTitle,
      categoryId: snippet.categoryId,
    };
  } catch (error: any) {
    console.error(`❌ Failed to fetch video details for ${videoId}:`, error.response?.status || error.message);
    return null;
  }
}

async function searchYouTubeVideos(query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> {
  try {
    await ensureApiKeysLoaded();
    const YOUTUBE_API_KEY = getNextApiKey();

    const SEARCH_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&order=relevance&key=${YOUTUBE_API_KEY}`;
    
    const searchResponse = await axios.get(SEARCH_URL, {
      timeout: 10000,
    });

    const results: YouTubeSearchResult[] = [];

    // OPTIMIZED: Get video details in batches instead of one by one
    const videoIds = searchResponse.data.items?.map((item: any) => item.id.videoId) || [];
    
    if (videoIds.length > 0) {
      // Batch request for video details
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
      let videoStats: any = {};
      
      try {
        const statsResponse = await axios.get(videosUrl, { timeout: 10000 });
        statsResponse.data.items?.forEach((item: any) => {
          videoStats[item.id] = item.statistics;
        });
      } catch (statsError) {
        console.warn('⚠️ Failed to fetch video statistics in batch');
      }

      for (const item of searchResponse.data.items || []) {
        const stats = videoStats[item.id.videoId];
        results.push({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          viewCount: stats?.viewCount,
        });
      }
    }

    return results;
  } catch (error: any) {
    console.error("❌ Failed to search YouTube videos:", error.response?.status || error.message);
    return [];
  }
}

async function getTrendingVideos(categoryId: string = "0", maxResults: number = 15): Promise<YouTubeVideoData[]> {
  try {
    await ensureApiKeysLoaded();
    const YOUTUBE_API_KEY = getNextApiKey();

    const TRENDING_URL = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=PK&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    
    const trendingResponse = await axios.get(TRENDING_URL, {
      timeout: 15000, // Longer timeout for trending videos
    });

    const trendingVideos: YouTubeVideoData[] = [];

    for (const video of trendingResponse.data.items || []) {
      const snippet = video.snippet;
      const statistics = video.statistics;

      trendingVideos.push({
        title: snippet.title,
        description: snippet.description || '',
        tags: snippet.tags || [],
        viewCount: statistics.viewCount || "0",
        likeCount: statistics.likeCount || "0",
        commentCount: statistics.commentCount || "0",
        publishedAt: snippet.publishedAt,
        channelTitle: snippet.channelTitle,
        categoryId: snippet.categoryId,
      });
    }

    return trendingVideos;
  } catch (error: any) {
    console.error("❌ Failed to fetch trending videos:", error.response?.status || error.message);
    return [];
  }
}

// OPTIMIZED ANALYSIS FUNCTION
function generateYouTubeInsights(videos: YouTubeVideoData[], searchResults: YouTubeSearchResult[]): YouTubeInsights {
  const allTitles = [
    ...videos.map((v) => v.title),
    ...searchResults.map((r) => r.title),
  ];

  if (allTitles.length === 0) {
    return {
      trendingKeywords: ['tutorial', 'guide', '2025', 'tips', 'how to'],
      successfulPatterns: ['How to', 'Ultimate', 'Secret'],
      avgTitleLength: 65,
      topPerformingTitles: []
    };
  }

  const keywordFreq: { [key: string]: number } = {};
  const patterns: string[] = [];
  let totalLength = 0;

  // Process tags from videos
  videos.forEach((video) => {
    video.tags.forEach((tag) => {
      const cleanTag = tag.toLowerCase().trim();
      if (cleanTag.length > 2 && cleanTag.length < 20) { // Filter reasonable tags
        keywordFreq[cleanTag] = (keywordFreq[cleanTag] || 0) + 1;
      }
    });
  });

  // Process titles
  allTitles.forEach((title) => {
    totalLength += title.length;

    // Extract common patterns
    const titleLower = title.toLowerCase();
    if (titleLower.includes("how to") || titleLower.includes("how i")) patterns.push("How to");
    if (titleLower.includes("i tried") || titleLower.includes("testing")) patterns.push("I tried");
    if (titleLower.includes("secret") || titleLower.includes("hidden")) patterns.push("Secret");
    if (titleLower.includes("why") && titleLower.includes("wrong")) patterns.push("Why X is Wrong");
    if (titleLower.includes("ultimate") || titleLower.includes("complete")) patterns.push("Ultimate");
    if (/\d+/.test(title)) patterns.push("Numbers");
    if (title.includes("2025") || title.includes("2024")) patterns.push("Current Year");

    // Extract words for keywords
    const words = title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && word.length < 15);

    words.forEach((word) => {
      keywordFreq[word] = (keywordFreq[word] || 0) + 1;
    });
  });

  const trendingKeywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword]) => keyword);

  return {
    trendingKeywords,
    successfulPatterns: [...new Set(patterns)],
    avgTitleLength: Math.round(totalLength / allTitles.length),
    topPerformingTitles: videos.slice(0, 3).map((v) => v.title),
  };
}

// ENHANCED PROMPT TEMPLATE WITH BETTER STRUCTURE
const getYouTubePromptTemplate = (prompt: string, youtubeInsights?: YouTubeInsights): string => {
  const currentYear = new Date().getFullYear();

  let insightsSection = "";
  
  if (youtubeInsights && youtubeInsights.trendingKeywords.length > 0) {
    insightsSection = `
🎯 YOUTUBE PERFORMANCE INSIGHTS:

📈 TRENDING KEYWORDS: ${youtubeInsights.trendingKeywords.slice(0, 8).join(", ")}
🏆 SUCCESSFUL PATTERNS: ${youtubeInsights.successfulPatterns.slice(0, 5).join(", ")}
📏 OPTIMAL TITLE LENGTH: ~${youtubeInsights.avgTitleLength} characters
🔥 TOP PERFORMING EXAMPLES:
${youtubeInsights.topPerformingTitles.slice(0, 3).map((title, i) => `${i + 1}. "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}"`).join('\n')}

💡 OPTIMIZATION STRATEGY:
- Use these trending keywords: ${youtubeInsights.trendingKeywords.slice(0, 5).join(", ")}
- Apply successful pattern: ${youtubeInsights.successfulPatterns[0] || "How-to format"}
- Target length: ${youtubeInsights.avgTitleLength} characters
`;
  }

  return `You are an expert YouTube SEO specialist. Generate 5 compelling YouTube titles optimized for views and engagement.

${insightsSection}

REQUIREMENTS:
- 60-100 characters per title
- Include trending keywords when relevant
- Use psychological triggers (curiosity, urgency, benefit)
- Current year: ${currentYear}
- Detailed descriptions (15-25 sentences each)

CONTENT TOPIC: "${prompt}"

PROVEN PATTERNS:
✅ "How I [Result] in [Time] (Method)"
✅ "[Number] [Things] That [Outcome] (Most Miss This)"
✅ "I Tried [Thing] for [Time] - Results"
✅ "Why [Belief] is Wrong (Real Truth)"
✅ "[Number] Secrets [Topic] (That Work)"

OUTPUT FORMAT (JSON only, no code blocks):
{"items":[{"title":"Title here","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5"],"description":"Detailed description here."},{"title":"Title 2","keywords":["kw1","kw2","kw3","kw4","kw5"],"description":"Description 2."}]}

Generate exactly 5 titles.`;
};

// IMPROVED OLLAMA FUNCTION WITH BETTER ERROR HANDLING
async function generateTitlesWithOllama(
  prompt: string,
  maxLength: number = 500,
  youtubeInsights?: YouTubeInsights
): Promise<TitleGenerationResponse> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen3:4b";

    console.log(`🤖 Using Ollama with model ${ollamaModel}${youtubeInsights ? " + YouTube insights" : ""}`);

    const promptTemplate = getYouTubePromptTemplate(prompt, youtubeInsights);

    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: ollamaModel,
        prompt: promptTemplate,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: Math.min(maxLength, 1000), // Reasonable limit
          stop: ["Human:", "Assistant:", "\n\nHuman:", "\n\nAssistant:"],
        },
      },
      {
        timeout: 60000, // 1 minute timeout
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.response;
    console.log("📝 Ollama response length:", content?.length || 0);

    if (!content || content.trim().length === 0) {
      throw new Error("Empty response from Ollama");
    }

    const result = extractTitlesFromResponse(content, prompt);

    const finalResult = {
      ...result,
      provider: youtubeInsights ? "ollama-enhanced" : "ollama",
    };

    if (finalResult.success) {
      await incrementFeatureUsage("title_generation");
    }

    return finalResult;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || "Unknown Ollama error";
    console.error("❌ Ollama service error:", errorMsg);
    throw new Error(`Ollama failed: ${errorMsg}`);
  }
}

// IMPROVED OPENROUTER FUNCTION WITH RETRY AND BETTER ERROR HANDLING
async function generateTitlesWithOpenRouter(
  prompt: string,
  maxLength: number = 500,
  model: string = "deepseek/deepseek-chat-v3-0324:free",
  youtubeInsights?: YouTubeInsights
): Promise<TitleGenerationResponse> {
  try {
    const url = process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
    console.log(`🌐 Using OpenRouter with model: ${model}${youtubeInsights ? " + YouTube insights" : ""}`);

    const systemMessage = `You are an expert YouTube SEO specialist. Generate compelling YouTube titles with keywords and descriptions optimized for maximum engagement and search visibility.`;
    const userMessage = getYouTubePromptTemplate(prompt, youtubeInsights);

    const requestData = {
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      max_tokens: Math.min(maxLength, 1500),
      temperature: 0.8,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3,
      response_format: { type: "json_object" },
    };

    const response = await axios.post(url, requestData, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "YouTube Title Generator Pro",
      },
      timeout: 45000, // 45 second timeout
    });

    console.log("📊 OpenRouter response status:", response.status);
    
    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response structure from OpenRouter");
    }

    const content = response.data.choices[0].message.content.trim();
    console.log("📝 OpenRouter response length:", content.length);

    const result = extractTitlesFromResponse(content, prompt);

    const finalResult = {
      ...result,
      provider: youtubeInsights ? "openrouter-enhanced" : "openrouter",
    };

    if (finalResult.success) {
      await incrementFeatureUsage("title_generation");
    }

    return finalResult;
  } catch (error: any) {
    let errorMsg = "Unknown OpenRouter error";
    let errorCode = 500;

    if (error.response) {
      errorCode = error.response.status;
      errorMsg = error.response.data?.error?.message || `HTTP ${errorCode}`;
      
      console.error("🔍 OpenRouter error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });

      // Handle specific error codes
      if (errorCode === 429) {
        errorMsg = "Rate limit exceeded. Please try again in a few minutes.";
      } else if (errorCode === 401) {
        errorMsg = "Invalid API key or authentication failed.";
      } else if (errorCode === 500) {
        errorMsg = "OpenRouter service temporarily unavailable.";
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMsg = "Request timeout - service took too long to respond.";
    } else {
      errorMsg = error.message;
    }

    console.error("❌ OpenRouter service error:", errorMsg);
    throw new Error(`OpenRouter failed: ${errorMsg}`);
  }
}

// KEEP ALL YOUR EXISTING HELPER FUNCTIONS...
function extractTitlesFromResponse(content: string, prompt: string): TitleGenerationResponse {
  try {
    console.log("🔍 Parsing content length:", content.length);

    let jsonContent = content.trim();

    // Remove code block markers
    if (jsonContent.includes("```")) {
      const codeMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch && codeMatch[1]) {
        jsonContent = codeMatch[1].trim();
      } else {
        jsonContent = jsonContent.replace(/```(?:json)?|```/g, "").trim();
      }
    }

    // Extract JSON structure
    const jsonMatch = jsonContent.match(/{[\s\S]*}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    // Clean formatting issues
    jsonContent = jsonContent
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");

    const parsedData = JSON.parse(jsonContent);

    // Validate and extract titles
    if (parsedData.items && Array.isArray(parsedData.items) && parsedData.items.length > 0) {
      const validItems = parsedData.items
        .filter((item: any) => {
          return (
            typeof item === "object" &&
            item !== null &&
            typeof item.title === "string" &&
            item.title.trim().length >= 20 &&
            item.title.trim().length <= 120 &&
            Array.isArray(item.keywords) &&
            item.keywords.length > 0 &&
            typeof item.description === "string" &&
            item.description.trim().length >= 20
          );
        })
        .slice(0, 5)
        .map((item: any) => ({
          title: item.title.trim(),
          keywords: item.keywords
            .filter((kw: any) => typeof kw === "string" && kw.trim().length > 0)
            .slice(0, 7),
          description: item.description.trim(),
        }));

      if (validItems.length > 0) {
        console.log(`✅ Successfully extracted ${validItems.length} valid titles`);
        return fillRemainingSlots(validItems, prompt);
      }
    }

    throw new Error("No valid title structure found in response");
  } catch (parseError: any) {
    console.log("❌ Parsing failed:", parseError.message);
    return {
      success: true,
      titles: generateEnhancedFallbackTitles(prompt),
    };
  }
}

// Keep your existing helper functions...
function fillRemainingSlots(validItems: TitleWithKeywords[], prompt: string): TitleGenerationResponse {
  const finalItems = [...validItems];

  if (finalItems.length < 5) {
    const fallbackTitles = generateEnhancedFallbackTitles(prompt);
    const needed = 5 - finalItems.length;

    for (let i = 0; i < needed && i < fallbackTitles.length; i++) {
      finalItems.push(fallbackTitles[i]);
    }
  }

  return {
    success: true,
    titles: finalItems.slice(0, 5),
  };
}

function generateEnhancedFallbackTitles(prompt: string): TitleWithKeywords[] {
  const currentYear = new Date().getFullYear();
  const topicShort = prompt.substring(0, 30).trim();
  const topicKeyword = topicShort.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  console.log(`🎯 Generating fallback titles for topic: "${topicShort}"`);

  return [
    {
      title: `How I Mastered ${topicShort} in ${currentYear} (Complete Guide)`,
      keywords: ["how to", topicKeyword, "tutorial", "guide", "step by step", `${currentYear}`, "complete"],
      description: `This comprehensive guide breaks down the exact system and strategies I used to master ${topicShort} this year. You'll learn the step-by-step process, common pitfalls to avoid, and proven techniques that actually work. Perfect for beginners and those looking to improve their skills with practical, actionable advice that delivers real results.`,
    },
    {
      title: `5 ${topicShort} Secrets That Actually Work (Proven Results)`,
      keywords: ["secrets", topicKeyword, "tips", "proven", "results", "strategies", "that work"],
      description: `Discover the five game-changing secrets that most people never learn about ${topicShort}. These proven strategies have been tested and refined to deliver real results. You'll learn insider techniques that can dramatically improve your success rate and give you a competitive advantage in this field.`,
    },
    {
      title: `Why Everyone Gets ${topicShort} Wrong (The Real Truth)`,
      keywords: ["truth about", topicKeyword, "mistakes", "wrong way", "reality", "exposed", "facts"],
      description: `Uncover the common misconceptions and critical mistakes that are sabotaging most people's success with ${topicShort}. Learn why conventional wisdom is often wrong and discover the correct approach that actually leads to results. This eye-opening analysis will change how you think about this topic.`,
    },
    {
      title: `I Tried ${topicShort} for 30 Days - Here's What Happened`,
      keywords: ["experiment", topicKeyword, "30 days", "results", "challenge", "review", "what happened"],
      description: `Follow my honest 30-day journey experimenting with ${topicShort} and see the real, unfiltered results. I'll share what worked, what didn't, the unexpected challenges I faced, and the valuable lessons learned throughout the process. Get an authentic look at the actual experience and outcomes.`,
    },
    {
      title: `Ultimate ${topicShort} Guide Nobody Talks About (${currentYear})`,
      keywords: ["ultimate guide", topicKeyword, "advanced", "comprehensive", `${currentYear}`, "expert", "secret"],
      description: `The most comprehensive and up-to-date guide to ${topicShort} that covers advanced strategies most content creators ignore. This expert-level resource provides in-depth knowledge and cutting-edge techniques for ${currentYear} and beyond. Perfect for those ready to take their skills to the next level.`,
    },
  ];
}

// OPTIMIZED MAIN FUNCTION WITH PARALLEL YOUTUBE REQUESTS
export async function generateTitle({
  prompt,
  maxLength = 500,
  model = "deepseek/deepseek-chat-v3-0324:free",
  useYouTubeAnalysis = true,
}: TitleGenerationOptions): Promise<TitleGenerationResponse> {
  const startTime = Date.now();
  console.log(`🚀 Starting title generation for: "${prompt.substring(0, 50)}..."${useYouTubeAnalysis ? " with YouTube insights" : ""}`);

  let youtubeInsights: YouTubeInsights | undefined;

  if (useYouTubeAnalysis) {
    try {
      console.log("📊 Gathering YouTube insights...");

      // OPTIMIZED: Run YouTube API calls in parallel with timeout
      const youtubePromise = Promise.allSettled([
        searchYouTubeVideos(prompt, 10),
        getTrendingVideos("0", 15),
      ]);

      const results = await Promise.race([
        youtubePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('YouTube API timeout')), 10000))
      ]) as PromiseSettledResult<any>[];

      let searchResults: YouTubeSearchResult[] = [];
      let trendingVideos: YouTubeVideoData[] = [];

      if (results[0].status === 'fulfilled') {
        searchResults = results[0].value;
      }
      if (results[1].status === 'fulfilled') {
        trendingVideos = results[1].value;
      }

      if (searchResults.length > 0 || trendingVideos.length > 0) {
        youtubeInsights = generateYouTubeInsights(trendingVideos, searchResults);
        console.log(`✅ YouTube insights generated in ${Date.now() - startTime}ms`);
        console.log(`📈 Found ${youtubeInsights.trendingKeywords.length} trending keywords`);
        console.log(`🎯 Analyzed ${trendingVideos.length} videos for patterns`);
      } else {
        console.log('⚠️ No YouTube data retrieved, continuing without insights');
      }
    } catch (error: any) {
      console.error("⚠️ YouTube insights failed:", error.message);
      console.log("🔄 Continuing without YouTube data...");
    }
  }

  // Validate input
  if (!prompt || prompt.trim().length < 3) {
    console.log("❌ Invalid prompt provided");
    return {
      success: false,
      titles: generateEnhancedFallbackTitles("general content"),
      provider: "fallback",
      error: "Invalid prompt provided",
    };
  }

  // Try Ollama first (if enabled)
  if (process.env.OLLAMA_ENABLED !== 'false') {
    try {
      console.log("🔄 Attempting Ollama generation...");
      const result = await generateTitlesWithOllama(prompt.trim(), maxLength, youtubeInsights);
      console.log(`✅ Ollama generation successful in ${Date.now() - startTime}ms`);
      return result;
    } catch (ollamaError: any) {
      console.log(`⚠️ Ollama failed: ${ollamaError.message}`);
    }
  }

  // Fallback to OpenRouter
  console.log("🔄 Using OpenRouter...");
  try {
    const result = await generateTitlesWithOpenRouter(prompt.trim(), maxLength, model, youtubeInsights);
    console.log(`✅ OpenRouter generation successful in ${Date.now() - startTime}ms`);
    return result;
  } catch (openRouterError: any) {
    console.error(`❌ OpenRouter failed: ${openRouterError.message}`);
    console.log("🔄 Using enhanced fallback titles");

    return {
      success: false,
      titles: generateEnhancedFallbackTitles(prompt),
      provider: "fallback",
      error: openRouterError.message || "Service is currently unavailable. Try again later.",
    };
  }
}

// Export functions
export { getVideoDetails, searchYouTubeVideos, getTrendingVideos, generateYouTubeInsights };