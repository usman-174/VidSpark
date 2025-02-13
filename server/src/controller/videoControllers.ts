import { Request, Response } from "express";
import { initializeDependencies } from "../utils/dependencies";
import * as youtubeService from "../services/ytService";

export const fetchAndStoreCategories = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const categories = await youtubeService.fetchCategories();
    res
      .status(200)
      .json({ message: "Categories populated successfully!", categories });
  } catch (error: any) {
    console.error(
      "Error fetching YouTube categories:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: "Failed to fetch and store YouTube categories" });
  }
};

export const scrapeVideos = async (req: Request, res: Response) => {
  try {
    await youtubeService.scrapeYouTubeVideos();
    res.status(200).json({ message: "Scraping complete" });
  } catch (error: any) {
    console.log("Error scraping videos:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limitOptions = [10, 20, 50, 100];
    const limit = limitOptions.includes(parseInt(req.query.limit as string))
      ? parseInt(req.query.limit as string)
      : 10;

    const result = await youtubeService.getVideoPaginated(page, limit);

    res.status(200).json({
      success: true,
      metadata: {
        totalVideos: result.totalVideos,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        pageSize: result.pageSize,
      },
      videos: result.videos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVideoById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { prisma } = await initializeDependencies();
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
    });
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.status(200).json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createVideo = async (req: Request, res: Response) => {
  try {
    const { prisma } = await initializeDependencies();
    const video = await prisma.video.create({
      data: req.body,
    });
    res.status(201).json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { prisma } = await initializeDependencies();
    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.status(200).json(video);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { prisma } = await initializeDependencies();
    await prisma.video.delete({
      where: { videoId: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.log("Error deleting video:", error.message);
    res.status(500).json({ error: error.message });
  }
};
