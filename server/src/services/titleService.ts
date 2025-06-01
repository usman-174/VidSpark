// titleService.ts - Enhanced YouTube Title Generator with Advanced Prompt Engineering
import axios from "axios";

// Define response types
interface TitleWithKeywords {
  title: string;
  keywords: string[];
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

  return `You are an expert YouTube SEO specialist and viral content creator with deep knowledge of YouTube's algorithm and viewer psychology. Generate 5 highly engaging, click-worthy YouTube video titles that will maximize both search visibility and click-through rates.

CRITICAL REQUIREMENTS:
- Each title must be 60-100 characters long (optimal for YouTube display)
- Use proven psychological triggers and power words
- Include specific numbers, years, or timeframes when relevant
- Create curiosity gaps that compel viewers to click
- Optimize for YouTube's search algorithm and recommendation system
- Feel fresh, current, and relevant for ${currentYear}

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

OUTPUT FORMAT:
Respond EXACTLY in this JSON format (no code blocks, no extra text):
{"items":[{"title":"Your compelling 60-100 character YouTube title here","keywords":["primary-keyword","long-tail-phrase","trending-term","action-keyword","time-specific","related-topic","search-phrase"]},{"title":"Another engaging title","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7"]}]}

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
    return {
      ...result,
      provider: "ollama",
    };
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

    const systemMessage = `You are an expert YouTube SEO specialist and viral content creator. You must respond with exactly 5 compelling YouTube titles and their associated keywords in JSON format. Each title must be 60-100 characters long and optimized for maximum clicks and search visibility. Use psychological triggers, power words, and proven YouTube title patterns. For each title, provide 5-7 relevant SEO keywords. Respond EXACTLY in this format: {"items":[{"title":"Title 1","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7"]},{"title":"Title 2","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7"]}]}. Do not include code blocks, backticks, or any other text outside the JSON object.`;

    const userMessage = getYouTubePromptTemplate(prompt);

    const response = await axios.post(
      url,
      {
        model,
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: userMessage,
          },
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
        timeout: 30000, // 30 second timeout
      }
    );

    console.log("📊 OpenRouter response status:", response.status);
    const content = response.data.choices[0].message.content.trim();
    console.log("📝 OpenRouter raw content:", content);

    const result = extractTitlesFromResponse(content, prompt);
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
            item.title.trim().length >= 20 &&
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
        // Fill remaining slots with enhanced fallback titles if needed
        const finalItems = [...validItems];
        const fallbackTitles = generateEnhancedFallbackTitles(prompt);

        while (finalItems.length < 5) {
          const fallbackIndex = finalItems.length - validItems.length;
          if (fallbackIndex < fallbackTitles.length) {
            finalItems.push(fallbackTitles[fallbackIndex]);
          } else {
            break;
          }
        }

        console.log(
          `✅ Successfully extracted ${finalItems.length} valid titles`
        );
        return {
          success: true,
          titles: finalItems,
        };
      }
    }

    // Try alternative parsing methods
    console.log("⚠️ Standard parsing failed, trying alternative methods...");

    // Check if it's a direct array of items
    if (Array.isArray(parsedData)) {
      const validItems = parsedData
        .filter(
          (item: any) =>
            typeof item === "object" &&
            typeof item.title === "string" &&
            Array.isArray(item.keywords)
        )
        .slice(0, 5);

      if (validItems.length > 0) {
        console.log(
          `✅ Extracted ${validItems.length} titles from direct array`
        );
        return {
          success: true,
          titles: validItems,
        };
      }
    }

    throw new Error("No valid title structure found in response");
  } catch (parseError: any) {
    console.log("❌ JSON parsing failed:", parseError.message);
    console.log("🔄 Generating enhanced fallback titles");

    return {
      success: true,
      titles: generateEnhancedFallbackTitles(prompt),
    };
  }
}

// Generate enhanced YouTube-style fallback titles
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
        error: `Both AI services failed. Ollama: ${ollamaError.message}. OpenRouter: ${openRouterError.message}`,
      };
    }
  }
}
