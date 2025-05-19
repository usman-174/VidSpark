// src/services/titleService.ts

import axios from "axios";

export interface TitleGenerationOptions {
  prompt: string;
  maxLength?: number;
  model?: string;
}

export interface TitleGenerationResponse {
  success: boolean;
  titles: string[];
  provider?: string;  // Indicate which provider was used
  error?: string;
}

// Ollama service function
async function generateTitlesWithOllama(prompt: string, maxLength: number = 400): Promise<TitleGenerationResponse> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen3:4b";
    
    console.log(`Using Ollama with model ${ollamaModel}`);
    
    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: ollamaModel,
      prompt: `You are a helpful assistant that generates SEO optimized titles for content. Generate 5 concise, engaging, and relevant titles for the following content. Each title should be between 50-65 characters long. Format your response as a JSON object with a 'titles' array containing exactly 5 string elements. Response format example: {"titles":["Title 1","Title 2","Title 3","Title 4","Title 5"]}

Content to generate titles for: ${prompt}

Remember to respond ONLY with the JSON object, no additional explanations or text.`,
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
    const result = extractTitlesFromResponse(content, prompt);
    return {
      ...result,
      provider: "ollama"
    };
  } catch (error) {
    console.error("Error with Ollama service:", error);
    // Re-throw the error to be caught by the main function
    throw error;
  }
}

// OpenRouter service function
async function generateTitlesWithOpenRouter(
  prompt: string, 
  maxLength: number = 400, 
  model: string = "deepseek/deepseek-chat-v3-0324:free"
): Promise<TitleGenerationResponse> {
  try {
    const url = process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
    console.log("Using OpenRouter URL with model:", model);

    const response = await axios.post(
      url,
      {
        model,
        messages: [
          {
            role: "system",
            content:
              'You are a helpful assistant that generates SEO optimized titles for content. You must respond with 5 titles in JSON format with a \'titles\' array field. Each title must be concise, engaging, and relevant to the provided content. Each title should be more than 50 and less than 65 characters long. Respond EXACTLY in this format: {"titles":["Title 1","Title 2","Title 3","Title 4","Title 5"]}. Do not include code blocks, backticks, or any other text outside the JSON object.',
          },
          {
            role: "user",
            content: `Generate 5 concise SEO-optimized titles for the following content or requirements: ${prompt}. Respond ONLY with a JSON object containing a 'titles' array with exactly 5 string elements.`,
          },
        ],
        max_tokens: maxLength,
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

    // Get response content
    const content = response.data.choices[0].message.content.trim();
    
    // Process the content to extract titles
    const result = extractTitlesFromResponse(content, prompt);
    return {
      ...result,
      provider: "openrouter"
    };
  } catch (error) {
    console.error("Error with OpenRouter service:", error);
    throw error;
  }
}

// Shared helper function to extract titles from any response
function extractTitlesFromResponse(content: string, prompt: string): TitleGenerationResponse {
  try {
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

    // Parse the JSON
    const parsedData = JSON.parse(jsonContent);

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

    // If we get here, the JSON didn't have a valid titles array
    throw new Error("Response did not contain a valid titles array");
  } catch (parseError) {
    console.log(
      "JSON parsing failed, attempting to extract titles from text:",
      parseError
    );

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
          !line.startsWith("}") &&
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

// Main function with automatic fallback
export async function generateTitle({
  prompt,
  maxLength = 400,
  model = "deepseek/deepseek-chat-v3-0324:free",
}: TitleGenerationOptions): Promise<TitleGenerationResponse> {
  // Try Ollama first
  try {
    return await generateTitlesWithOllama(prompt, maxLength);
  } catch (ollamaError) {
    console.log("Ollama failed, falling back to OpenRouter:", ollamaError.message);
    
    // If Ollama fails, try OpenRouter
    try {
      return await generateTitlesWithOpenRouter(prompt, maxLength, model);
    } catch (openRouterError) {
      console.error("Both Ollama and OpenRouter failed:", openRouterError.message);
      
      // If both fail, return a generic response
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