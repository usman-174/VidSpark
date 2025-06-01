// src/controller/titleController.ts
import { Request, Response } from "express";
import { generateTitle } from "../services/titleService";
import { deductCredits } from "../services/userService";
import { getUser } from "../services/authService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface for title with keywords
interface TitleWithKeywords {
  title: string;
  keywords: string[];
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
            // Check if the title is a string or an object with title and keywords
            if (typeof titleData === "string") {
              return {
                title: titleData,
                keywords: [], // Empty array for titles without keywords
              };
            } else {
              return {
                title: titleData.title,
                keywords: titleData.keywords || [],
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

    // New parameter to control whether to include keywords

    // New parameter to control whether to save titles to database
    const saveTitles =
      req.body.saveTitles !== false && req.query.saveTitles !== "false"; // Default to true

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

    // Deduct credits only if the operation was successful
    if (result.success) {
      await deductCredits(res.locals.user.userId, 1);

      // Save titles to database as a generation if requested
      if (saveTitles && result.titles && result.titles.length > 0) {
        try {
          const savedGeneration = await saveTitleGeneration(
            res.locals.user.userId,
            prompt,
            result.titles,
            result.provider
          );

          // Add the generation ID to the response
          result.generationId = savedGeneration.id;
        } catch (saveError) {
          console.error("Error saving title generation:", saveError);
          // Continue with the response even if saving fails
        }
      }
    }

    return res.json(result);
  } catch (error) {
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
        titles: true,
      },
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
  try {
    const { id } = req.params;
    const userId = res.locals.user.userId;

    const generation = await prisma.titleGeneration.findFirst({
      where: {
        id,
        userId, // Ensure the user can only access their own generations
      },
      include: {
        titles: true,
      },
    });

    if (!generation) {
      return res.status(404).json({
        success: false,
        message: "Title generation not found",
      });
    }

    return res.json({
      success: true,
      generation,
    });
  } catch (error) {
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
    });

    if (!title) {
      return res.status(404).json({
        success: false,
        message: "Title not found or access denied",
      });
    }

    // Toggle the favorite status
    const updatedTitle = await prisma.generatedTitle.update({
      where: { id: titleId },
      data: { isFavorite: !title.isFavorite },
    });

    return res.json({
      success: true,
      title: updatedTitle,
    });
  } catch (error) {
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
  try {
    const userId = res.locals.user.userId;

    const favoriteTitles = await prisma.generatedTitle.findMany({
      where: {
        generation: {
          userId,
        },
        isFavorite: true,
      },
      include: {
        generation: {
          select: {
            prompt: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        generation: {
          createdAt: "desc",
        },
      },
    });

    return res.json({
      success: true,
      titles: favoriteTitles,
    });
  } catch (error) {
    console.error("Error fetching favorite titles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorite titles",
      titles: [],
      error: error.message,
    });
  }
};
