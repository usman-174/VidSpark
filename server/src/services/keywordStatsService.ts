import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Log or increment a keyword’s popularity
export const recordKeywordUsage = async (keyword: string) => {
  const cleaned = keyword.trim().toLowerCase();

  await prisma.keywordUsage.create({
    data: {
      keyword: cleaned,
    },
  });
};


export const getTopKeywords = async (limit: number = 10) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Aggregate count grouped by keyword for last 7 days
  const keywords = await prisma.keywordUsage.groupBy({
    by: ['keyword'],
    where: {
      createdAt: {
        gte: oneWeekAgo,
      },
    },
    _count: {
      keyword: true,
    },
    orderBy: {
      _count: {
        keyword: 'desc',
      },
    },
    take: limit,
  });

  return keywords.map(({ keyword, _count }) => ({
    term: keyword,
    usageCount: _count.keyword,
  }));
};
