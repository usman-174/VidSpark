// titleService.ts - Enhanced YouTube Title Generator with Advanced Prompt Engineering
import axios from "axios";
import { incrementFeatureUsage, updateFavoriteFeature } from "./statsService";

// Define response types
export interface TitleWithKeywords {
  title: string;
  keywords: string[];
  description: string; // Now required description for the title
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
}

// Enhanced YouTube-specific prompt template
const getYouTubePromptTemplate = (prompt: string): string => {
  const currentYear = new Date().getFullYear();

  return `You are an expert YouTube SEO specialist and viral content creator with deep knowledge of YouTube's algorithm and viewer psychology. Generate 3 highly engaging, click-worthy YouTube video titles that will maximize both search visibility and click-through rates.

CRITICAL REQUIREMENTS:
- Each title must be 60-100 characters long (optimal for YouTube display)
- Use proven psychological triggers and power words
- Include specific numbers, years, or timeframes when relevant
- Create curiosity gaps that compel viewers to click
- Optimize for YouTube's search algorithm and recommendation system
- Feel fresh, current, and relevant for ${currentYear}
- MUST include a compelling description for each title (5-10 sentences explaining what the video would cover)

PSYCHOLOGICAL TRIGGERS TO INCORPORATE:
🔥 Urgency: "Before It's Too Late", "Right Now", "Today", "Immediately"
🤔 Curiosity: "Secret", "Hidden", "What Nobody Tells You", "Shocking Truth"
👑 Authority: "Expert", "Pro", "Advanced", "Ultimate", "Master"
👥 Social Proof: "Everyone", "Most People", "Millions", "Thousands"
💪 Benefit-driven: "How to", "Ways to", "Steps to", "Proven Method"
⚡ Controversy: "Why X is Wrong", "The Truth About", "Exposed"
🎯 Exclusivity: "Only", "Exclusive", "Private", "Insider"
📈 Results: "That Actually Work", "Proven", "Guaranteed", "Results"

PROVEN YOUTUBE TITLE PATTERNS (USE THESE):
✅ "How I [Achieved Specific Result] in [Timeframe] (Exact Method)"
✅ "The [Number] [Thing] That [Positive Outcome] (Most People Miss This)"
✅ "[Number] [Thing] You Should Never [Action] (Do This Instead)"
✅ "I Tried [Thing/Method] for [Time Period] - Here's What Happened"
✅ "Why [Popular Belief] is Actually Wrong (The Real Truth)"
✅ "[Number] Signs You're [Situation] (and How to Fix It Fast)"
✅ "What [Expert/Successful Person] Won't Tell You About [Topic]"
✅ "[Thing] That Changed My [Life/Business] in [Timeframe]"
✅ "The Secret [Method/Strategy] [Successful People] Don't Want You to Know"
✅ "[Number] Minute [Action] That [Amazing Result]"

CONTENT ANALYSIS:
Topic/Content: "${prompt}"

KEYWORD STRATEGY:
For each title, provide 5-7 highly relevant SEO keywords that include:
- Primary topic keywords
- Long-tail search phrases
- Trending related terms
- Action-oriented keywords
- Year/time-specific keywords

DESCRIPTION REQUIREMENTS:
For each title, create a compelling 8-12(long length) sentence description that:
- Explains what the video would cover
- Highlights the main benefit or value proposition
- Creates additional interest and context
- Uses persuasive language to encourage viewing
- Mentions specific outcomes or results viewers can expect

OUTPUT FORMAT:
Respond EXACTLY in this JSON format (no code blocks, no extra text):
{"items":[{"title":"Your compelling 60-100 character YouTube title here","keywords":["primary-keyword","long-tail-phrase","trending-term","action-keyword","time-specific","related-topic","search-phrase"],"description":"A compelling 2-3 sentence description explaining what this video would cover and why viewers should watch it. This should highlight the main benefits and create additional interest."},{"title":"Another engaging title","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7"],"description":"Another engaging description that explains the video content and value proposition to potential viewers."}]}

Generate 5 titles that would make viewers immediately stop scrolling and click to watch the video.`;
};

// Ollama service function
async function generateTitlesWithOllama(
  prompt: string,
  maxLength: number = 500
): Promise<TitleGenerationResponse> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen3:4b";

    console.log(`🤖 Using Ollama with model ${ollamaModel}`);

    const promptTemplate = getYouTubePromptTemplate(prompt);

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: ollamaModel,
      prompt: promptTemplate,
      stream: false,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: maxLength,
        stop: ["Human:", "Assistant:", "\n\nHuman:", "\n\nAssistant:"],
      },
    });

    const content = response.data.response;
    console.log("📝 Ollama raw response:", content);

    const result = extractTitlesFromResponse(content, prompt);

    const finalResult = {
      ...result,
      provider: "ollama",
    };

    if (finalResult.success) {
      await incrementFeatureUsage("title_generation"); // ✅ Log usage
    }

    return finalResult;
  } catch (error: any) {
    console.error("❌ Ollama service error:", error.message);
    throw error;
  }
}

// OpenRouter service function
async function generateTitlesWithOpenRouter(
  prompt: string,
  maxLength: number = 500,
  model: string = "deepseek/deepseek-chat-v3-0324:free"
): Promise<TitleGenerationResponse> {
  try {
    const url =
      process.env.OPENROUTER_URL ||
      "https://openrouter.ai/api/v1/chat/completions";
    console.log(`🌐 Using OpenRouter with model: ${model}`);

    const systemMessage = `You are an expert YouTube SEO specialist and viral content creator. Your task is to generate compelling YouTube titles with detailed descriptions and relevant keywords. Focus on creating titles that maximize click-through rates and search visibility.`;
    const userMessage = getYouTubePromptTemplate(prompt);

    const response = await axios.post(
      url,
      {
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxLength,
        temperature: 0.8,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "YouTube Title Generator Pro",
        },
        timeout: 30000,
      }
    );

    console.log("📊 OpenRouter response status:", response.status);
    const content = response.data.choices[0].message.content.trim();
    console.log("📝 OpenRouter raw content:", content);

    const result = extractTitlesFromResponse(content, prompt);

    const finalResult = {
      ...result,
      provider: "openrouter",
    };

    if (finalResult.success) {
      await incrementFeatureUsage("title_generation"); // ✅ Log usage
    }

    return finalResult;
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

// Enhanced helper function to extract titles from API responses
function extractTitlesFromResponse(
  content: string,
  prompt: string
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

    // Method 1: Standard format validation
    if (
      parsedData.items &&
      Array.isArray(parsedData.items) &&
      parsedData.items.length > 0
    ) {
      const validItems = parsedData.items
        .filter((item: any) => {
          const isValid =
            typeof item === "object" &&
            item !== null &&
            typeof item.title === "string" &&
            item.title.trim().length >= 20 &&
            item.title.trim().length <= 120 &&
            Array.isArray(item.keywords) &&
            item.keywords.length > 0 &&
            typeof item.description === "string" &&
            item.description.trim().length >= 20;

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
          description: item.description.trim(),
        }));

      if (validItems.length > 0) {
        console.log(
          `✅ Successfully extracted ${validItems.length} valid titles using standard format`
        );
        return fillRemainingSlots(validItems, prompt);
      }
    }

    // Method 2: Handle malformed flat array format (your edge case)
    if (parsedData.items && Array.isArray(parsedData.items)) {
      console.log("🔄 Attempting to parse malformed flat array format...");
      const reconstructedItems = reconstructFromFlatArray(parsedData.items);

      if (reconstructedItems.length > 0) {
        console.log(
          `✅ Successfully reconstructed ${reconstructedItems.length} titles from flat array`
        );
        return fillRemainingSlots(reconstructedItems, prompt);
      }
    }

    // Method 3: Handle direct array format
    if (Array.isArray(parsedData)) {
      console.log("🔄 Attempting to parse direct array format...");
      const validItems = parsedData
        .filter(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            typeof item.title === "string" &&
            Array.isArray(item.keywords) &&
            typeof item.description === "string"
        )
        .slice(0, 5)
        .map((item: any) => ({
          title: item.title.trim(),
          keywords: item.keywords
            .filter((kw: any) => typeof kw === "string" && kw.trim().length > 0)
            .slice(0, 7),
          description:
            item.description?.trim() ||
            generateDescriptionForTitle(item.title, prompt),
        }));

      if (validItems.length > 0) {
        console.log(
          `✅ Successfully extracted ${validItems.length} titles from direct array`
        );
        return fillRemainingSlots(validItems, prompt);
      }
    }

    // Method 4: Try to extract from malformed JSON with regex patterns
    const regexExtractedItems = extractWithRegexPatterns(content, prompt);
    if (regexExtractedItems.length > 0) {
      console.log(
        `✅ Successfully extracted ${regexExtractedItems.length} titles using regex patterns`
      );
      return fillRemainingSlots(regexExtractedItems, prompt);
    }

    throw new Error("No valid title structure found in response");
  } catch (parseError: any) {
    console.log("❌ All parsing methods failed:", parseError.message);
    console.log("🔄 Generating enhanced fallback titles");

    return {
      success: true,
      titles: generateEnhancedFallbackTitles(prompt),
    };
  }
}
// New helper function to reconstruct titles from flat array format
function reconstructFromFlatArray(flatArray: any[]): TitleWithKeywords[] {
  const reconstructedItems: TitleWithKeywords[] = [];

  try {
    for (let i = 0; i < flatArray.length; i++) {
      // Look for "title" string followed by actual title
      if (flatArray[i] === "title" && i + 1 < flatArray.length) {
        let title = "";
        let keywords: string[] = [];
        let description = "";

        // Extract title
        if (typeof flatArray[i + 1] === "string") {
          title = flatArray[i + 1].trim();
        }

        // Look for keywords
        for (let j = i + 2; j < flatArray.length; j++) {
          if (flatArray[j] === "keywords" && j + 1 < flatArray.length) {
            if (Array.isArray(flatArray[j + 1])) {
              keywords = flatArray[j + 1]
                .filter(
                  (kw: any) => typeof kw === "string" && kw.trim().length > 0
                )
                .slice(0, 7);
            }
            break;
          }
        }

        // Look for description
        for (let j = i + 2; j < flatArray.length; j++) {
          if (flatArray[j] === "description" && j + 1 < flatArray.length) {
            if (typeof flatArray[j + 1] === "string") {
              description = flatArray[j + 1].trim();
            }
            break;
          }
        }

        // Validate and add the reconstructed item
        if (title.length >= 20 && title.length <= 120 && keywords.length > 0) {
          reconstructedItems.push({
            title,
            keywords,
            description:
              description || generateDescriptionForTitle(title, "content"),
          });

          // Stop if we have enough items
          if (reconstructedItems.length >= 5) break;
        }
      }
    }
  } catch (error) {
    console.log("⚠️ Error reconstructing from flat array:", error);
  }

  return reconstructedItems;
}

// New helper function to extract titles using regex patterns
function extractWithRegexPatterns(
  content: string,
  prompt: string
): TitleWithKeywords[] {
  const extractedItems: TitleWithKeywords[] = [];

  try {
    // Pattern 1: Look for quoted titles that seem like YouTube titles
    const titlePattern =
      /"([^"]{30,100}[^"]*(?:2025|How|Secret|Why|I Tried|Ultimate)[^"]*?)"/g;
    const titleMatches = content.match(titlePattern);

    if (titleMatches) {
      titleMatches.slice(0, 5).forEach((match, index) => {
        const title = match.replace(/"/g, "").trim();
        if (title.length >= 20 && title.length <= 120) {
          extractedItems.push({
            title,
            keywords: generateKeywordsForTitle(title, prompt),
            description: generateDescriptionForTitle(title, prompt),
          });
        }
      });
    }

    // Pattern 2: Look for numbered lists that might be titles
    const numberedPattern = /\d+\.\s*([^\n]{30,100})/g;
    const numberedMatches = content.match(numberedPattern);

    if (numberedMatches && extractedItems.length < 5) {
      numberedMatches.slice(0, 5 - extractedItems.length).forEach((match) => {
        const title = match.replace(/\d+\.\s*/, "").trim();
        if (title.length >= 20 && title.length <= 120) {
          extractedItems.push({
            title,
            keywords: generateKeywordsForTitle(title, prompt),
            description: generateDescriptionForTitle(title, prompt),
          });
        }
      });
    }
  } catch (error) {
    console.log("⚠️ Error extracting with regex patterns:", error);
  }

  return extractedItems;
}
// Helper function to generate keywords for a title
function generateKeywordsForTitle(title: string, prompt: string): string[] {
  const baseKeywords = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const titleWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // Combine and deduplicate
  const allKeywords = [...baseKeywords, ...titleWords];
  const uniqueKeywords = [...new Set(allKeywords)];

  // Add some common YouTube keywords
  const commonKeywords = [
    "tutorial",
    "guide",
    "tips",
    "2025",
    "how to",
    "secrets",
    "exposed",
  ];

  return [...uniqueKeywords, ...commonKeywords].slice(0, 7);
}

// Helper function to fill remaining slots with fallback titles
function fillRemainingSlots(
  validItems: TitleWithKeywords[],
  prompt: string
): TitleGenerationResponse {
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
// Helper function to generate description for a title
function generateDescriptionForTitle(
  title: string,
  originalPrompt: string
): string {
  const topic = originalPrompt.substring(0, 50).trim();
  const currentYear = new Date().getFullYear();

  // Generate contextual description based on title patterns
  if (title.includes("How I") || title.includes("How to")) {
    return `This comprehensive guide walks you through the exact steps and strategies used to achieve real results. You'll learn practical techniques that you can implement immediately to see measurable improvements in your ${topic} journey.`;
  } else if (title.includes("Secret") || title.includes("Nobody Tells You")) {
    return `Discover the insider knowledge and hidden strategies that most people never learn about ${topic}. This video reveals the techniques that experts use but rarely share publicly, giving you a competitive advantage.`;
  } else if (title.includes("I Tried") || title.includes("What Happened")) {
    return `Follow along as I document my real experience and share the honest results, including what worked, what didn't, and the surprising lessons learned. You'll get an authentic look at the actual process and outcomes.`;
  } else if (title.includes("Why") && title.includes("Wrong")) {
    return `Uncover the common misconceptions and mistakes that are holding most people back from success with ${topic}. Learn the correct approach and why conventional wisdom might be leading you astray.`;
  } else {
    return `Get expert insights and proven strategies for ${topic} that deliver real results. This video provides actionable advice and practical tips that you can use to improve your skills and achieve your goals in ${currentYear}.`;
  }
}

// Generate enhanced YouTube-style fallback titles with descriptions
function generateEnhancedFallbackTitles(prompt: string): TitleWithKeywords[] {
  const currentYear = new Date().getFullYear();
  const topicShort = prompt.substring(0, 30).trim();
  const topicKeyword = topicShort
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  console.log(`🎯 Generating fallback titles for topic: "${topicShort}"`);

  return [
    {
      title: `How I Mastered ${topicShort} in ${currentYear} (Complete Guide)`,
      keywords: [
        "how to",
        topicKeyword,
        "tutorial",
        "guide",
        "step by step",
        `${currentYear}`,
        "complete",
      ],
      description: `This comprehensive guide breaks down the exact system and strategies I used to master ${topicShort} this year. You'll learn the step-by-step process, common pitfalls to avoid, and proven techniques that actually work. Perfect for beginners and those looking to improve their skills.`,
    },
    {
      title: `5 ${topicShort} Secrets That Actually Work (Proven Results)`,
      keywords: [
        "secrets",
        topicKeyword,
        "tips",
        "proven",
        "results",
        "strategies",
        "that work",
      ],
      description: `Discover the five game-changing secrets that most people never learn about ${topicShort}. These proven strategies have been tested and refined to deliver real results. You'll learn insider techniques that can dramatically improve your success rate.`,
    },
    {
      title: `Why Everyone Gets ${topicShort} Wrong (The Real Truth)`,
      keywords: [
        "truth about",
        topicKeyword,
        "mistakes",
        "wrong way",
        "reality",
        "exposed",
        "facts",
      ],
      description: `Uncover the common misconceptions and critical mistakes that are sabotaging most people's success with ${topicShort}. Learn why conventional wisdom is often wrong and discover the correct approach that actually leads to results.`,
    },
    {
      title: `I Tried ${topicShort} for 30 Days - Here's What Happened`,
      keywords: [
        "experiment",
        topicKeyword,
        "30 days",
        "results",
        "challenge",
        "review",
        "what happened",
      ],
      description: `Follow my honest 30-day journey experimenting with ${topicShort} and see the real, unfiltered results. I'll share what worked, what didn't, the unexpected challenges I faced, and the valuable lessons learned throughout the process.`,
    },
    {
      title: `Ultimate ${topicShort} Guide Nobody Talks About (${currentYear})`,
      keywords: [
        "ultimate guide",
        topicKeyword,
        "advanced",
        "comprehensive",
        `${currentYear}`,
        "expert",
        "secret",
      ],
      description: `The most comprehensive and up-to-date guide to ${topicShort} that covers advanced strategies most content creators ignore. This expert-level resource provides in-depth knowledge and cutting-edge techniques for ${currentYear} and beyond.`,
    },
  ];
}

// Main title generation function with intelligent fallback
export async function generateTitle({
  prompt,
  maxLength = 500,
  model = "deepseek/deepseek-chat-v3-0324:free",
}: TitleGenerationOptions): Promise<TitleGenerationResponse> {
  console.log(
    `🚀 Starting title generation for: "${prompt.substring(0, 50)}..."`
  );

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

  // Try Ollama first
  try {
    console.log("🔄 Attempting Ollama generation...");
    throw new Error("Simulated Ollama failure"); // Simulate failure for testing
    const result = await generateTitlesWithOllama(prompt.trim(), maxLength);
    console.log("✅ Ollama generation successful");
    return result;
  } catch (ollamaError: any) {
    console.log(`⚠️ Ollama failed: ${ollamaError.message}`);
    console.log("🔄 Falling back to OpenRouter...");

    // Fallback to OpenRouter
    try {
      const result = await generateTitlesWithOpenRouter(
        prompt.trim(),
        maxLength,
        model
      );
      console.log("✅ OpenRouter generation successful");
      return result;
    } catch (openRouterError: any) {
      console.error(`❌ OpenRouter also failed: ${openRouterError.message}`);
      console.log("🔄 Using enhanced fallback titles");

      // Both services failed - return enhanced fallback
      return {
        success: false,
        titles: generateEnhancedFallbackTitles(prompt),
        provider: "fallback",
        error: `Service is Currently unavailable. Try again later.`,
      };
    }
  }
}
