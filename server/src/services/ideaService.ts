import Parser from "rss-parser";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const parser = new Parser();
const prisma = new PrismaClient();

interface TitleGenerationResponse {
  success: boolean;
  titles?: Array<{
    title: string;
    keywords: string[];
  }>;
  provider?: string;
  originalNews?: string;
  error?: string;
}

interface NewsItem {
  title: string;
  link?: string;
  pubDate?: Date | string;
}

// Enhanced OpenRouter service function for diverse YouTube content ideas
async function generateIdeasWithOpenRouter(
  newsTitle: string,
  maxLength: number = 600,
  model: string = "deepseek/deepseek-chat-v3-0324:free"
): Promise<TitleGenerationResponse> {
  try {
    const url =
      process.env.OPENROUTER_URL ||
      "https://openrouter.ai/api/v1/chat/completions";
    console.log(`🌐 Using OpenRouter with model: ${model}`);

    const systemMessage = `You are a creative YouTube content strategist specializing in viral, entertaining content for Pakistani audiences. Your task is to transform ANY topic into engaging YouTube video ideas across diverse categories.

CONTENT CATEGORIES TO CONSIDER:
- Entertainment & Comedy (pranks, funny reactions, sketches, roasts)
- Gaming & Tech (reviews, tutorials, gameplay, unboxings)
- Music & Dance (covers, reactions, challenges, dance tutorials)
- Food & Lifestyle (recipes, vlogs, challenges, taste tests)
- Educational & Informative (explanations, tips, hacks, tutorials)
- Trending Challenges & Viral Content (TikTok trends, memes, reactions)
- Sports & Fitness (workouts, challenges, analysis, vlogs)
- Travel & Culture (experiences, comparisons, vlogs, food tours)
- DIY & Creative Projects (crafts, hacks, tutorials, transformations)
- Beauty & Fashion (tutorials, reviews, hauls, transformations)

TITLE CREATION RULES:
1. Create 3-5 completely different YouTube video titles
2. Each title should be 40-75 characters long
3. Use emotional hooks, curiosity gaps, and trending formats
4. Include numbers, action words, and emotional triggers
5. Make titles clickable but authentic (not misleading clickbait)
6. Consider Pakistani context but don't force "Pakistan" in every title
7. Think beyond news - create entertaining, engaging content ideas
8. Use popular YouTube formats: "I Tried...", "10 Ways...", "REACTION to...", "How to...", "CRAZY...", "SECRET...", "SHOCKING...", etc.
9. Add urgency and curiosity: "You Won't Believe...", "This Changed Everything...", "Finally Revealed..."

AVOID:
- Repetitive use of "Pakistan" in titles
- Only serious/news-focused content
- Boring or overly formal language
- Generic titles without hooks
- Titles that are too similar to each other

Return your response in this exact JSON format:
{
  "items": [
    {
      "title": "Your Engaging YouTube Title Here",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

    const userMessage = `Transform this topic into diverse, entertaining YouTube video ideas: "${newsTitle}"

Think creatively about different angles and make them FUN and ENGAGING:
- Entertainment/Comedy: pranks, reactions, funny takes, roasts, sketches
- Gaming/Tech: reviews, tutorials, challenges, unboxings, comparisons
- Music/Dance: covers, reactions, challenges, tutorials, collaborations
- Food/Lifestyle: recipes, vlogs, experiences, taste tests, challenges
- Educational: explanations, tips, tutorials, life hacks, secrets
- Trending/Viral: challenges, memes, reactions, social experiments
- Sports/Fitness: workouts, challenges, analysis, transformation vlogs
- Travel/Culture: experiences, comparisons, vlogs, hidden gems
- DIY/Creative: projects, hacks, tutorials, before/after transformations
- Beauty/Fashion: tutorials, reviews, hauls, style challenges

Generate 4-5 DIFFERENT titles across various categories that would make Pakistani youth and general audiences click immediately. Focus on entertainment value, not just information!`;

    const response = await axios.post(
      url,
      {
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxLength,
        temperature: 0.9,
        top_p: 0.95,
        frequency_penalty: 0.6,
        presence_penalty: 0.5,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "Ideas of the Day Generator",
        },
        timeout: 30000,
      }
    );

    console.log("📊 OpenRouter response status:", response.status);
    const content = response.data.choices[0].message.content.trim();
    console.log("📝 OpenRouter raw content:", content);

    const result = extractTitlesFromResponse(content, newsTitle);

    return {
      ...result,
      provider: "openrouter",
    };
  } catch (error: any) {
    console.error("❌ OpenRouter service error:", error.message);
    if (error.response) {
      console.error("🔍 OpenRouter error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    throw error;
  }
}

// Enhanced function to generate creative topics when news is limited
function generateCreativeTopics(): string[] {
  const entertainmentTopics = [
    "Latest viral TikTok trends",
    "Pakistani drama funny moments",
    "Celebrity social media drama",
    "Comedy sketch ideas",
    "Prank ideas for friends",
    "Reaction to viral videos",
    "Roasting trending topics",
    "Social experiments in Pakistan",
  ];

  const gamingTechTopics = [
    "Popular mobile games in Pakistan",
    "Budget gaming setup under 50k",
    "Technology gadget reviews",
    "Gaming tournaments highlights",
    "Free games worth playing",
    "Tech hacks for students",
    "Smartphone camera comparisons",
    "Gaming chair vs regular chair",
  ];

  const lifestyleFoodTopics = [
    "Street food adventures",
    "Home cooking recipes",
    "Food challenges",
    "Healthy snacks under 100 rupees",
    "Ramadan special recipes",
    "Taste testing international foods",
    "Cooking without gas",
    "Food delivery app reviews",
  ];

  const musicDanceTopics = [
    "Music cover songs",
    "Dance challenges",
    "Bollywood movie reactions",
    "Pakistani music vs international",
    "Learning dance in 24 hours",
    "Music production at home",
    "Singing without training",
    "Dance battle compilation",
  ];

  const trendingTopics = [
    "Fashion and style tips",
    "DIY craft projects",
    "Fitness challenges",
    "Travel destinations in Pakistan",
    "Beauty tutorials on budget",
    "Study tips for exams",
    "Room decoration ideas",
    "Money saving hacks",
  ];

  const allTopics = [
    ...entertainmentTopics,
    ...gamingTechTopics,
    ...lifestyleFoodTopics,
    ...musicDanceTopics,
    ...trendingTopics,
  ];

  // Return 8 random topics for better variety
  return allTopics.sort(() => 0.5 - Math.random()).slice(0, 8);
}

// Enhanced helper function to extract titles from API responses
function extractTitlesFromResponse(
  content: string,
  originalNews: string
): TitleGenerationResponse {
  try {
    console.log("🔍 Parsing content:", content.substring(0, 200) + "...");

    // Clean up the response content
    let jsonContent = content.trim();

    // Remove code block markers if they exist
    if (jsonContent.includes("```")) {
      const codeMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch && codeMatch[1]) {
        jsonContent = codeMatch[1].trim();
      } else {
        jsonContent = jsonContent.replace(/```(?:json)?|```/g, "").trim();
      }
    }

    // Extract JSON-like structure
    const jsonMatch = jsonContent.match(/{[\s\S]*}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    // Clean up common formatting issues
    jsonContent = jsonContent
      .replace(/,\s*}/g, "}") // Remove trailing commas
      .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes

    console.log("🧹 Cleaned JSON content:", jsonContent);

    const parsedData = JSON.parse(jsonContent);
    console.log(
      "✅ Parsed data structure:",
      JSON.stringify(parsedData, null, 2)
    );

    // Validate and extract items
    if (
      parsedData.items &&
      Array.isArray(parsedData.items) &&
      parsedData.items.length > 0
    ) {
      const validItems = parsedData.items
        .filter((item: any) => {
          const isValid =
            typeof item === "object" &&
            typeof item.title === "string" &&
            item.title.trim().length >= 25 &&
            item.title.trim().length <= 120 &&
            Array.isArray(item.keywords) &&
            item.keywords.length > 0;

          if (!isValid) {
            console.log("⚠️ Invalid item filtered out:", item);
          }
          return isValid;
        })
        .slice(0, 5)
        .map((item: any) => ({
          title: item.title.trim(),
          keywords: item.keywords
            .filter((kw: any) => typeof kw === "string" && kw.trim().length > 0)
            .slice(0, 7),
        }));

      if (validItems.length > 0) {
        console.log(
          `✅ Successfully extracted ${validItems.length} valid titles`
        );
        return {
          success: true,
          titles: validItems,
          originalNews,
        };
      }
    }

    // Fallback if parsing fails
    throw new Error("No valid title structure found in response");
  } catch (parseError: any) {
    console.log("❌ JSON parsing failed:", parseError.message);
    console.log("🔄 Generating fallback titles");

    // Generate fallback titles manually
    const fallbackTitles = generateFallbackTitles(originalNews);
    return {
      success: true,
      titles: fallbackTitles,
      originalNews,
    };
  }
}

// Generate fallback titles when AI processing fails
function generateFallbackTitles(
  originalNews: string
): Array<{ title: string; keywords: string[] }> {
  const templates = [
    `🔥 SHOCKING: ${originalNews}`,
    `How to React to ${originalNews}`,
    `My Thoughts on ${originalNews}`,
    `Breaking Down ${originalNews}`,
    `What ${originalNews} Means for You`,
  ];

  return templates.slice(0, 3).map((template) => ({
    title: template.length > 80 ? template.substring(0, 77) + "..." : template,
    keywords: ["viral", "trending", "Pakistan", "reaction", "explained"],
  }));
}

export const fetchAndSaveIdeasOfTheDay = async () => {
  try {
    console.log("🚀 Fetching and generating diverse ideas of the day...");

    // Enhanced RSS feeds for diverse content
    const rssFeeds = [
      // Global trending topics for diverse content
      "https://news.google.com/rss/search?q=trending+viral+when:24h&hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/search?q=entertainment+celebrity+music&hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/search?q=technology+gaming+gadgets&hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/search?q=food+cooking+recipe+challenge&hl=en-US&gl=US&ceid=US:en",
      "https://news.google.com/rss/search?q=sports+fitness+workout&hl=en-US&gl=US&ceid=US:en",

      // Pakistan-specific but diverse categories
      "https://news.google.com/rss/search?q=Pakistan+entertainment+drama&hl=en-PK&gl=PK&ceid=PK:en",
      "https://news.google.com/rss/search?q=Pakistan+sports+cricket&hl=en-PK&gl=PK&ceid=PK:en",
      "https://news.google.com/rss/search?q=Pakistan+technology+startup&hl=en-PK&gl=PK&ceid=PK:en",
    ];

    const allNewsItems: NewsItem[] = [];

    // Fetch from RSS feeds with error handling
    for (const feedUrl of rssFeeds) {
      try {
        console.log(`📡 Fetching RSS feed: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        const items = feed.items.slice(0, 6).map((item) => ({
          title: item.title || "",
          link: item.link || "",
          pubDate: item.pubDate || new Date(),
        }));
        allNewsItems.push(...items);
        console.log(`✅ Fetched ${items.length} items from RSS feed`);
      } catch (error) {
        console.error(`❌ Error fetching RSS feed: ${feedUrl}`, error);
        continue;
      }
    }

    // Add creative topics for better diversity
    const creativeTopics = generateCreativeTopics();
    console.log(`🎨 Generated ${creativeTopics.length} creative topics`);

    creativeTopics.forEach((topic) => {
      allNewsItems.push({
        title: topic,
        link: "",
        pubDate: new Date(),
      });
    });

    // Remove duplicates and shuffle for maximum diversity
    const uniqueNewsItems = Array.from(
      new Map(
        allNewsItems.map((item) => [item.title?.toLowerCase(), item])
      ).values()
    )
      .filter((item) => item.title && item.title.length > 10)
      .sort(() => 0.5 - Math.random())
      .slice(0, 30); // Increased pool for better selection

    console.log(`📊 Processing ${uniqueNewsItems.length} unique topics`);

    // Generate new ideas first before deleting existing ones
    const newIdeas = [];
    const usedTitles = new Set<string>();
    const maxIdeas = 12; // Increased for better variety

    for (const item of uniqueNewsItems) {
      if (!item.title || newIdeas.length >= maxIdeas) break;

      try {
        console.log(`🎯 Processing topic: ${item.title}`);

        // Generate YouTube title ideas using OpenRouter
        const titleResponse = await generateIdeasWithOpenRouter(item.title);

        if (
          titleResponse.success &&
          titleResponse.titles &&
          titleResponse.titles.length > 0
        ) {
          // Try to get diverse titles and avoid duplicates
          for (const titleData of titleResponse.titles) {
            if (newIdeas.length >= maxIdeas) break;

            const titleLower = titleData.title.toLowerCase();

            // Skip if we already have this title or very similar
            if (usedTitles.has(titleLower)) continue;

            // Check for title similarity (basic check)
            const isSimilar = Array.from(usedTitles).some((usedTitle) => {
              const similarity = calculateSimilarity(titleLower, usedTitle);
              return similarity > 0.7; // 70% similarity threshold
            });

            if (isSimilar) continue;

            // Prepare the idea data but don't save to database yet
            const ideaData = {
              title: titleData.title,
              originalNews: item.title,
              link: item.link || "",
              keywords: titleData.keywords || [],
              pubDate: new Date(item.pubDate || new Date()),
            };

            newIdeas.push(ideaData);
            usedTitles.add(titleLower);
            console.log(`✅ Prepared idea: ${titleData.title}`);
            break; // Move to next source topic
          }
        } else {
          console.log(`⚠️ Failed to generate ideas for: ${item.title}`);
        }
      } catch (error) {
        console.error(`❌ Error processing topic: ${item.title}`);
        continue;
      }
    }

    // Only proceed with database operations if we have successfully generated new ideas
    if (newIdeas.length === 0) {
      console.log("⚠️ No new ideas generated. Keeping existing ideas.");
      throw new Error("Failed to generate any new ideas");
    }

    console.log(
      `🎯 Successfully generated ${newIdeas.length} new ideas. Proceeding with database update...`
    );

    // Use a transaction to ensure atomic operation
    const savedIdeas = await prisma.$transaction(async (tx) => {
      // Delete all existing ideas only after we have new ones ready
      await tx.ideasOfTheDay.deleteMany({});
      console.log("🗑️ Cleared previous ideas of the day");

      // Save all new ideas
      const savedItems = [];
      for (const ideaData of newIdeas) {
        const newIdea = await tx.ideasOfTheDay.create({
          data: ideaData,
        });
        savedItems.push(newIdea);
      }

      return savedItems;
    });

    console.log(
      `🎉 Successfully saved ${savedIdeas.length} diverse ideas of the day`
    );

    return savedIdeas;
  } catch (error) {
    console.error("❌ Error fetching and saving ideas of the day:", error.message);
    throw error;
  }
};
// Simple similarity calculation function
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  const commonWords = words1.filter((word) => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);

  return commonWords.length / totalWords;
}

export const getIdeasOfTheDayByDate = async () => {
  try {
    const ideas = await prisma.ideasOfTheDay.findMany({
      orderBy: {
        pubDate: "desc",
      },
      select: {
        id: true,
        title: true,
        originalNews: true,
        link: true,
        keywords: true,
        pubDate: true,
        createdAt: true,
      },
      take: 12, // Return up to 12 ideas
    });

    console.log(`📋 Retrieved ${ideas.length} ideas from database`);
    return ideas;
  } catch (error) {
    console.error("❌ Error getting ideas:", error);
    throw error;
  }
};

// Additional helper function to ensure database schema compatibility
export const ensureIdeasTableStructure = async () => {
  try {
    // This is a helper function in case you need to verify table structure
    // You might want to add this to your migration or initialization
    console.log("🔍 Checking ideas table structure...");

    const sampleIdea = await prisma.ideasOfTheDay.findFirst();
    if (sampleIdea) {
      console.log("✅ Ideas table structure verified");
    } else {
      console.log("ℹ️ No existing ideas found - table is ready for new data");
    }
  } catch (error) {
    console.error("❌ Error checking table structure:", error);
    throw error;
  }
};
