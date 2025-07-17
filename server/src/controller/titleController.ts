// src/controller/titleController.ts
import { Request, Response } from "express";
import { generateTitle } from "../services/titleService";
import { deductCredits } from "../services/userService";
import { getUser } from "../services/authService";
import {
  trackFeatureUsage,
  trackPopularContent,
  updateFavoriteFeature,
} from "../services/statsService";
import { ContentType, FeatureType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Updated interface for title with keywords and description
interface TitleWithKeywords {
  title: string;
  keywords: string[];
  description: string; // Now required description field
}

// Function to save a generation of titles to database
async function saveTitleGeneration(
  userId: string,
  prompt: string,
  titles: string[] | TitleWithKeywords[],
  provider?: string
) {
  try {
    // Create the title generation record with related titles
    const titleGeneration = await prisma.titleGeneration.create({
      data: {
        prompt,
        userId,
        provider,
        titles: {
          create: titles.map((titleData) => {
            // Check if the title is a string or an object with title, keywords, and description
            if (typeof titleData === "string") {
              return {
                title: titleData,
                keywords: [], // Empty array for titles without keywords
                description: `Generated title for: ${prompt.substring(
                  0,
                  50
                )}...`, // Default description
              };
            } else {
              return {
                title: titleData.title,
                keywords: titleData.keywords || [],
                description:
                  titleData.description ||
                  `Generated title for: ${prompt.substring(0, 50)}...`, // Use provided description or fallback
              };
            }
          }),
        },
      },
      include: {
        titles: true, // Include the created titles in the response
      },
    });

    return titleGeneration;
  } catch (error) {
    console.error("Error saving title generation to database:", error);
    throw error;
  }
}

export const generateTitles = async (
  req: Request,
  res: Response
): Promise<any> => {
  const startTime = Date.now();
  let success = false;

  try {
    const prompt = req.body.prompt || (req.query.prompt as string);
    const maxLength = parseInt(
      req.body.maxLength || (req.query.maxLength as string) || "400"
    );
    const model =
      req.body.model ||
      (req.query.model as string) ||
      process.env.TITLE_MODEL ||
      "deepseek/deepseek-chat-v3-0324:free";

    const saveTitles =
      req.body.saveTitles !== false && req.query.saveTitles !== "false";

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
        titles: [],
      });
    }

    const user = await getUser(res.locals.user.userId);

    // Check for sufficient credits
    if (user.creditBalance < 1) {
      await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
        userId: res.locals.user.userId,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: "Insufficient credits",
        prompt: prompt.substring(0, 100),
      });

      return res.status(403).json({
        success: false,
        message: "Insufficient credits to generate titles.",
        titles: [],
      });
    }

    const result = await generateTitle({
      prompt,
      maxLength,
      model,
    });

    if (result.success) {
      success = true;
      const processingTime = Date.now() - startTime;

      await deductCredits(res.locals.user.userId, 1);

      // Track successful title generation
      await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
        userId: res.locals.user.userId,
        processingTime,
        success: true,
        titleCount: result.titles?.length || 0,
        model,
        promptLength: prompt.length,
        maxLength,
        provider: result.provider,
      });

      // Track popular prompts and generated titles
      await trackPopularContent(ContentType.KEYWORD, prompt.substring(0, 200), {
        titleCount: result.titles?.length || 0,
        model,
        provider: result.provider,
      });

      // Track generated titles as popular content
      if (result.titles && Array.isArray(result.titles)) {
        for (const titleData of result.titles.slice(0, 3)) {
          // Track top 3 titles
          const titleText =
            typeof titleData === "string" ? titleData : titleData.title;
          await trackPopularContent(ContentType.TITLE, titleText, {
            fromPrompt: prompt.substring(0, 50),
            model,
            hasDescription:
              typeof titleData === "object" && !!titleData.description,
          });
        }
      }

      // Save titles to database if requested
      if (saveTitles && result.titles && result.titles.length > 0) {
        try {
          const savedGeneration = await saveTitleGeneration(
            res.locals.user.userId,
            prompt,
            result.titles,
            result.provider
          );
          result.generationId = savedGeneration.id;

          // ✅ ADD THIS: Include the saved title IDs in the response
          result.titles = savedGeneration.titles.map((savedTitle, index) => {
            const originalTitle = result.titles[index];

            if (typeof originalTitle === "string") {
              return {
                id: savedTitle.id,
                title: originalTitle,
                keywords: savedTitle.keywords,
                description: savedTitle.description,
                isFavorite: savedTitle.isFavorite,
              };
            } else {
              return {
                ...originalTitle,
                id: savedTitle.id,
                isFavorite: savedTitle.isFavorite,
              };
            }
          });
        } catch (saveError) {
          console.error("Error saving title generation:", saveError);
        }
      }
    } else {
      // Track failed generation
      await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
        userId: res.locals.user.userId,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: "Title generation failed",
        model,
        promptLength: prompt.length,
      });
    }

    return res.json(result);
  } catch (error) {
    // Track error
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId: res.locals.user?.userId,
      processingTime: Date.now() - startTime,
      success: false,
      errorMessage: error.message || "Unknown error",
    });

    console.error("Error generating titles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate titles",
      titles: [],
      error: error.message,
    });
  }
};

// Get all title generations for a user
export const getUserTitleGenerations = async (
  req: Request,
  res: Response
): Promise<any> => {
  const startTime = Date.now();

  try {
    const userId = res.locals.user.userId;
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.titleGeneration.count({
      where: { userId },
    });

    // Get title generations with pagination, including titles
    const generations = await prisma.titleGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        titles: {
          select: {
            id: true,
            title: true,
            keywords: true,
            description: true, // Include description in the response
            isFavorite: true,
          },
        },
      },
    });

    // Track user accessing their generations
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId,
      processingTime: Date.now() - startTime,
      success: true,
      isRetrieval: true,
      generationsCount: generations.length,
      totalGenerations: totalCount,
      page,
    });

    return res.json({
      success: true,
      generations,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId: res.locals.user?.userId,
      processingTime: Date.now() - startTime,
      success: false,
      isRetrieval: true,
      errorMessage: error.message,
    });

    console.error("Error fetching title generations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch title generations",
      generations: [],
      error: error.message,
    });
  }
};

// Get a specific title generation by ID
export const getTitleGenerationById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const startTime = Date.now();

  try {
    const { id } = req.params;
    const userId = res.locals.user.userId;

    const generation = await prisma.titleGeneration.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        titles: {
          select: {
            id: true,
            title: true,
            keywords: true,
            description: true, // Include description in the response
            isFavorite: true,
          },
        },
      },
    });

    if (!generation) {
      await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
        userId,
        processingTime: Date.now() - startTime,
        success: false,
        isRetrieval: true,
        errorMessage: "Generation not found",
        generationId: id,
      });

      return res.status(404).json({
        success: false,
        message: "Title generation not found",
      });
    }

    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId,
      processingTime: Date.now() - startTime,
      success: true,
      isRetrieval: true,
      generationId: id,
      titlesCount: generation.titles.length,
    });

    return res.json({
      success: true,
      generation,
    });
  } catch (error) {
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId: res.locals.user?.userId,
      processingTime: Date.now() - startTime,
      success: false,
      isRetrieval: true,
      errorMessage: error.message,
    });

    console.error("Error fetching title generation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch title generation",
      error: error.message,
    });
  }
};

// Toggle favorite status for a title
export const toggleFavoriteTitle = async (
  req: Request,
  res: Response
): Promise<any> => {
  const startTime = Date.now();

  try {
    const { titleId } = req.params;
    const userId = res.locals.user.userId;

    // First, check if the title belongs to the user
    const title = await prisma.generatedTitle.findFirst({
      where: {
        id: titleId,
        generation: {
          userId,
        },
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        description: true, // Include description
        isFavorite: true,
      },
    });

    if (!title) {
      await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
        userId,
        processingTime: Date.now() - startTime,
        success: false,
        isFavoriteAction: true,
        errorMessage: "Title not found or access denied",
        titleId,
      });

      return res.status(404).json({
        success: false,
        message: "Title not found or access denied",
      });
    }

    // Toggle the favorite status
    const updatedTitle = await prisma.generatedTitle.update({
      where: { id: titleId },
      data: { isFavorite: !title.isFavorite },
      select: {
        id: true,
        title: true,
        keywords: true,
        description: true, // Include description in response
        isFavorite: true,
      },
    });

    // Track favorite action
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId,
      processingTime: Date.now() - startTime,
      success: true,
      isFavoriteAction: true,
      favoriteStatus: updatedTitle.isFavorite,
      titleId,
    });

    // Track popular favorited titles
    if (updatedTitle.isFavorite) {
      await trackPopularContent(ContentType.TITLE, updatedTitle.title, {
        isFavorited: true,
        userId,
        hasDescription: !!updatedTitle.description,
      });
    }

    return res.json({
      success: true,
      title: updatedTitle,
    });
  } catch (error) {
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId: res.locals.user?.userId,
      processingTime: Date.now() - startTime,
      success: false,
      isFavoriteAction: true,
      errorMessage: error.message,
    });

    console.error("Error toggling favorite status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update favorite status",
      error: error.message,
    });
  }
};

// Get all favorite titles for a user
export const getFavoriteTitles = async (
  req: Request,
  res: Response
): Promise<any> => {
  const startTime = Date.now();

  try {
    const userId = res.locals.user.userId;

    const favoriteTitles = await prisma.generatedTitle.findMany({
      where: {
        generation: {
          userId,
        },
        isFavorite: true,
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        description: true, // Include description
        isFavorite: true,
        generation: {
          select: {
            id: true,
            prompt: true,
            createdAt: true,
            provider: true,
          },
        },
      },
      orderBy: {
        generation: {
          createdAt: "desc",
        },
      },
    });

    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId,
      processingTime: Date.now() - startTime,
      success: true,
      isFavoriteRetrieval: true,
      favoriteTitlesCount: favoriteTitles.length,
    });

    return res.json({
      success: true,
      titles: favoriteTitles,
    });
  } catch (error) {
    await trackFeatureUsage(FeatureType.TITLE_GENERATION, {
      userId: res.locals.user?.userId,
      processingTime: Date.now() - startTime,
      success: false,
      isFavoriteRetrieval: true,
      errorMessage: error.message,
    });

    console.error("Error fetching favorite titles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorite titles",
      titles: [],
      error: error.message,
    });
  }
};
