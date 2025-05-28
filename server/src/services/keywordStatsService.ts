import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Log or increment a keyword’s popularity
export const recordKeywordUsage = async (keyword: string) => {
  const cleaned = keyword.trim().toLowerCase();

  await prisma.popularKeyword.upsert({
    where: { keyword: cleaned },
    update: {
      count: { increment: 1 },
    },
    create: {
      keyword: cleaned,
      count: 1,
    },
  });
};

export const getTopKeywords = async (limit: number = 10) => {
  const keywords = await prisma.popularKeyword.findMany({
    orderBy: {
      count: "desc",
    },
    take: limit,
  });

  return keywords.map(({ keyword, count }) => ({
    term: keyword,
    usageCount: count,
  }));
};
