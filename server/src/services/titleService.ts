// titleService.ts - Enhanced with keyword generation
import axios from "axios";

// Define response types
interface TitleWithKeywords {
  title: string;
  keywords: string[];
}

interface TitleGenerationResponse {
  success: boolean;
  titles: string[] | TitleWithKeywords[];
  keywords?: string[];
  provider?: string;
  error?: string;
  generationId?: string;
}

interface TitleGenerationOptions {
  prompt: string;
  maxLength?: number;
  model?: string;
  includeKeywords?: boolean;
}

// Ollama service function
async function generateTitlesWithOllama(
  prompt: string, 
  maxLength: number = 400,
  includeKeywords: boolean = false
): Promise<TitleGenerationResponse> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen3:4b";
    
    console.log(`Using Ollama with model ${ollamaModel}`);
    
    // Enhanced prompt for title and keyword generation
    const promptTemplate = includeKeywords ? 
      `You are a helpful assistant that generates SEO optimized titles and keywords for content. Generate 5 concise, engaging, and relevant titles for the following content. Each title should be between 50-65 characters long. For each title, also provide 3-5 related SEO keywords.

Format your response as a JSON object with 'items' array containing 5 objects, each with 'title' and 'keywords' properties. The 'keywords' property should be an array of strings.

Response format example: {"items":[{"title":"Title 1","keywords":["keyword1","keyword2","keyword3"]},{"title":"Title 2","keywords":["keyword1","keyword2","keyword3"]},...]}

Content to generate titles for: ${prompt}

Remember to respond ONLY with the JSON object, no additional explanations or text.` 
      : 
      `You are a helpful assistant that generates SEO optimized titles for content. Generate 5 concise, engaging, and relevant titles for the following content. Each title should be between 50-65 characters long. Format your response as a JSON object with a 'titles' array containing exactly 5 string elements. Response format example: {"titles":["Title 1","Title 2","Title 3","Title 4","Title 5"]}

Content to generate titles for: ${prompt}

Remember to respond ONLY with the JSON object, no additional explanations or text.`;
    
    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: ollamaModel,
      prompt: promptTemplate,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: maxLength
      }
    });
    
    // Ollama response is in response.data.response
    const content = response.data.response;
    
    // Try to extract JSON
    const result = extractTitlesFromResponse(content, prompt, includeKeywords);
    return {
      ...result,
      provider: "ollama"
    };
  } catch (error) {
    console.error("Error with Ollama service:", error.message);
    // Re-throw the error to be caught by the main function
    throw error;
  }
}

// OpenRouter service function
async function generateTitlesWithOpenRouter(
  prompt: string, 
  maxLength: number = 400, 
  model: string = "deepseek/deepseek-chat-v3-0324:free",
  includeKeywords: boolean = false
): Promise<TitleGenerationResponse> {
  try {
    const url = process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
    console.log("Using OpenRouter URL with model:", model);

    // System message depending on whether keywords are needed
    const systemMessage = includeKeywords ?
      'You are a helpful assistant that generates SEO optimized titles and keywords for content. You must respond with 5 titles and their associated keywords in JSON format. Each title must be concise, engaging, and relevant to the provided content. Each title should be between 50-65 characters long. For each title, provide 3-5 relevant SEO keywords. Respond EXACTLY in this format: {"items":[{"title":"Title 1","keywords":["keyword1","keyword2","keyword3"]},{"title":"Title 2","keywords":["keyword1","keyword2"]}]}. Do not include code blocks, backticks, or any other text outside the JSON object.' :
      'You are a helpful assistant that generates SEO optimized titles for content. You must respond with 5 titles in JSON format with a \'titles\' array field. Each title must be concise, engaging, and relevant to the provided content. Each title should be more than 50 and less than 65 characters long. Respond EXACTLY in this format: {"titles":["Title 1","Title 2","Title 3","Title 4","Title 5"]}. Do not include code blocks, backticks, or any other text outside the JSON object.';

    // User message depending on whether keywords are needed
    const userMessage = includeKeywords ?
      `Generate 5 concise SEO-optimized titles with 3-5 keywords for each title for the following content or requirements: ${prompt}. Respond ONLY with a JSON object containing an 'items' array with objects having 'title' and 'keywords' properties.` :
      `Generate 5 concise SEO-optimized titles for the following content or requirements: ${prompt}. Respond ONLY with a JSON object containing a 'titles' array with exactly 5 string elements.`;

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
        temperature: 0.7,
        response_format: { type: "json_object" }, // Ensure JSON format response
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Title Generator",
        },
      }
    );

    // Log full response for debugging
    console.log("OpenRouter response:", JSON.stringify(response.data, null, 2));

    // Get response content
    const content = response.data.choices[0].message.content.trim();
    console.log("Raw content from OpenRouter:", content);
    
    // Process the content to extract titles
    const result = extractTitlesFromResponse(content, prompt, includeKeywords);
    return {
      ...result,
      provider: "openrouter"
    };
  } catch (error) {
    console.error("Error with OpenRouter service:", error.message);
    if (error.response) {
      console.error("OpenRouter error response:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Shared helper function to extract titles from any response
function extractTitlesFromResponse(content: string, prompt: string, includeKeywords: boolean = false): TitleGenerationResponse {
  try {
    console.log("Attempting to parse content:", content);
    
    // Try to parse JSON from the response
    // First, clean up any code block formatting or other non-JSON content
    let jsonContent = content;

    // Remove code block markers if they exist
    if (jsonContent.includes("```")) {
      // Extract content between code block markers
      const codeMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch && codeMatch[1]) {
        jsonContent = codeMatch[1].trim();
      } else {
        // If we can't extract from code blocks, remove all code block markers
        jsonContent = jsonContent.replace(/```(?:json)?|```/g, "").trim();
      }
    }

    // Find any JSON-like structure in the text
    const jsonMatch = jsonContent.match(/{[\s\S]*}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    console.log("Cleaned JSON content:", jsonContent);

    // Parse the JSON
    const parsedData = JSON.parse(jsonContent);
    console.log("Parsed data:", JSON.stringify(parsedData, null, 2));

    if (includeKeywords) {
      // Check for items array with title and keywords
      if (
        parsedData.items &&
        Array.isArray(parsedData.items) &&
        parsedData.items.length > 0
      ) {
        // Extract and validate each title with keywords
        const validItems = parsedData.items
          .filter(
            (item: any) => 
              typeof item === "object" && 
              typeof item.title === "string" && 
              item.title.trim().length > 0 &&
              Array.isArray(item.keywords)
          )
          .slice(0, 5);

        // If we have valid items, return them
        if (validItems.length > 0) {
          // Fill in with generic titles if needed
          const finalItems = [...validItems];
          while (finalItems.length < 5) {
            finalItems.push({
              title: `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`,
              keywords: ["seo", "optimized", "content"]
            });
          }

          return {
            success: true,
            titles: finalItems,
          };
        }
      }
    } else {
      // Check if we have a titles array
      if (
        parsedData.titles &&
        Array.isArray(parsedData.titles) &&
        parsedData.titles.length > 0
      ) {
        // Extract and validate each title
        const validTitles = parsedData.titles
          .filter(
            (title: string) => typeof title === "string" && title.trim().length > 0
          )
          .slice(0, 5);

        // If we have valid titles, return them
        if (validTitles.length > 0) {
          // Fill in with generic titles if needed
          const finalTitles = [...validTitles];
          while (finalTitles.length < 5) {
            finalTitles.push(
              `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`
            );
          }

          return {
            success: true,
            titles: finalTitles,
          };
        }
      }
    }

    // If we get here, the JSON didn't have a valid titles array or items array
    // Let's attempt to extract directly from the structure if possible
    if (!includeKeywords && Array.isArray(parsedData)) {
      // The response might be a direct array of titles
      const validTitles = parsedData
        .filter((item: any) => typeof item === "string" && item.trim().length > 0)
        .slice(0, 5);
        
      if (validTitles.length > 0) {
        const finalTitles = [...validTitles];
        while (finalTitles.length < 5) {
          finalTitles.push(`SEO-Optimized Title for: ${prompt.substring(0, 30)}...`);
        }
        
        return {
          success: true,
          titles: finalTitles,
        };
      }
    }

    throw new Error("Response did not contain a valid titles array or items array");
  } catch (parseError) {
    console.log(
      "JSON parsing failed, attempting to extract titles from text:",
      parseError.message
    );

    if (includeKeywords) {
      // Create fallback titles with keywords
      return {
        success: true,
        titles: [
          {
            title: `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`,
            keywords: ["seo", "optimized", "content"]
          },
          {
            title: `Top Guide to ${prompt.substring(0, 30)}...`,
            keywords: ["guide", "tutorial", "top"]
          },
          {
            title: `Essential ${prompt.substring(0, 30)}... Tips`,
            keywords: ["essential", "tips", "strategies"]
          },
          {
            title: `Complete ${prompt.substring(0, 30)}... Guide`,
            keywords: ["complete", "guide", "comprehensive"]
          },
          {
            title: `Everything About ${prompt.substring(0, 30)}...`,
            keywords: ["everything", "complete", "detailed"]
          },
        ],
      };
    } else {
      // First try: Look for numbered list (1. Title one 2. Title two)
      const numberedListRegex = /\d+\.\s*([^.!?]+[.!?]?)/g;
      const numberedMatches = [...content.matchAll(numberedListRegex)];

      if (numberedMatches.length >= 3) {
        const extractedTitles = numberedMatches
          .map((match) => match[1].trim())
          .filter((title) => title.length > 0 && title.length <= 100)
          .slice(0, 5);

        if (extractedTitles.length > 0) {
          // Fill in with generic titles if needed
          while (extractedTitles.length < 5) {
            extractedTitles.push(
              `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`
            );
          }

          return {
            success: true,
            titles: extractedTitles,
          };
        }
      }

      // Second try: Split by newlines and extract reasonable-looking titles
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 10 &&
            line.length <= 100 &&
            !line.startsWith("```") &&
            !line.startsWith("{") &&
            !line.includes("titles") &&
            !line.includes('":"') &&
            !line.startsWith("[") &&
            !line.startsWith("]")
        );

      if (lines.length > 0) {
        const extractedTitles = lines
          .map((line) => line.replace(/^\d+\.\s*|\*\s*|-\s*|"/g, "").trim())
          .filter((title) => title.length > 0)
          .slice(0, 5);

        // Fill in with generic titles if needed
        while (extractedTitles.length < 5) {
          extractedTitles.push(
            `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`
          );
        }

        return {
          success: true,
          titles: extractedTitles,
        };
      }

      // Last resort: Generate generic titles
      return {
        success: true,
        titles: [
          `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`,
          `Top Guide to ${prompt.substring(0, 30)}...`,
          `Essential ${prompt.substring(0, 30)}... Tips`,
          `Complete ${prompt.substring(0, 30)}... Guide`,
          `Everything About ${prompt.substring(0, 30)}...`,
        ],
      };
    }
  }
}

// Main function with automatic fallback
export async function generateTitle({
  prompt,
  maxLength = 400,
  model = "deepseek/deepseek-chat-v3-0324:free",
  includeKeywords = false
}: TitleGenerationOptions): Promise<TitleGenerationResponse> {
  // Try Ollama first
  try {
    // REMOVE THE SIMULATED ERROR
    // throw new Error("Simulated error for testing fallback");
    return await generateTitlesWithOllama(prompt, maxLength, includeKeywords);
  } catch (ollamaError) {
    console.log("Ollama failed, falling back to OpenRouter:", ollamaError.message);
    
    // If Ollama fails, try OpenRouter
    try {
      return await generateTitlesWithOpenRouter(prompt, maxLength, model, includeKeywords);
    } catch (openRouterError) {
      console.error("Both Ollama and OpenRouter failed:", openRouterError.message);
      
      // If both fail, return a generic response with or without keywords
      if (includeKeywords) {
        return {
          success: false,
          titles: [
            {
              title: `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`,
              keywords: ["seo", "optimized", "content"]
            },
            {
              title: `Top Guide to ${prompt.substring(0, 30)}...`,
              keywords: ["guide", "tutorial", "top"]
            },
            {
              title: `Essential ${prompt.substring(0, 30)}... Tips`,
              keywords: ["essential", "tips", "strategies"]
            },
            {
              title: `Complete ${prompt.substring(0, 30)}... Guide`,
              keywords: ["complete", "guide", "comprehensive"]
            },
            {
              title: `Everything About ${prompt.substring(0, 30)}...`,
              keywords: ["everything", "complete", "detailed"]
            },
          ],
          provider: "fallback",
          error: "Both local and remote title generation services failed"
        };
      } else {
        return {
          success: false,
          titles: [
            `SEO-Optimized Title for: ${prompt.substring(0, 30)}...`,
            `Top Guide to ${prompt.substring(0, 30)}...`,
            `Essential ${prompt.substring(0, 30)}... Tips`,
            `Complete ${prompt.substring(0, 30)}... Guide`,
            `Everything About ${prompt.substring(0, 30)}...`,
          ],
          provider: "fallback",
          error: "Both local and remote title generation services failed"
        };
      }
    }
  }
}