import { initializeDependencies } from '../utils/dependencies';
import { getNextApiKey, loadKeysFromDB } from "../scripts/YTscraper";

export async function fetchCategories() {
  const { axios, prisma } = await initializeDependencies();
  
  await loadKeysFromDB();
  const apiKey = getNextApiKey();
  const url = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=PK&key=${apiKey}`;
  
  const response = await axios.get(url);
  const categories = response.data.items;

  if (!categories || categories.length === 0) {
    throw new Error("No categories found from YouTube API");
  }

  const results = [];
  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { categoryId: category.id },
      update: { title: category.snippet.title },
      create: { categoryId: category.id, title: category.snippet.title },
    });
    results.push(result);
  }

  return results;
}

export async function scrapeYouTubeVideos() {
  const { scrapeYouTubeData } = await initializeDependencies();
  await scrapeYouTubeData();
}

export async function getVideoPaginated(page: number, limit: number) {
  const { prisma } = await initializeDependencies();
  
  const skip = (page - 1) * limit;
  const totalVideos = await prisma.video.count();
  const totalPages = Math.ceil(totalVideos / limit);

  const videos = await prisma.video.findMany({
    skip,
    take: limit,
    orderBy: { trendingDate: "desc" },
    include: { category: true },
  });

  return {
    totalVideos,
    currentPage: page,
    totalPages,
    pageSize: limit,
    videos,
  };
}