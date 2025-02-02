import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { Request, Response } from "express";
import {
  getNextApiKey,
  loadKeysFromDB,
  scrapeYouTubeData,
} from "../scripts/YTscraper";

const prisma = new PrismaClient();

export const fetchAndStoreCategories = async (req: Request, res: Response) => {
  try {
    await loadKeysFromDB();
    const apiKey = getNextApiKey();
    const url = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=PK&key=${apiKey}`;
    const response = await axios.get(url);
    const categories = response.data.items;

    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found from YouTube API" });
    }

    for (const category of categories) {
      await prisma.category.upsert({
        where: { categoryId: category.id },
        update: { title: category.snippet.title },
        create: { categoryId: category.id, title: category.snippet.title },
      });
    }

    res.status(200).json({ message: "Categories populated successfully!" });
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
    await scrapeYouTubeData();
    res.status(200).json({ message: "Scraping complete" });
  } catch (error: any) {
    console.log("Error scraping videos:", error.message);

    res.status(500).json({ error: error.message });
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1; // Default to page 1
    const limit = parseInt(req.query.limit as string) || 10; // Default limit to 10
    const skip = (page - 1) * limit;

    // Get total video count for metadata
    const totalVideos = await prisma.video.count();
    const totalPages = Math.ceil(totalVideos / limit);

    const videos = await prisma.video.findMany({
      skip,
      take: limit,
      orderBy: { trendingDate: "desc" }, // Latest trending first,
      include: { category: true },
    });

    res.status(200).json({
      success: true,
      metadata: {
        totalVideos,
        currentPage: page,
        totalPages,
        pageSize: limit,
      },
      videos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
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
    await prisma.video.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
