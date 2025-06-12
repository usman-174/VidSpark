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


export const getTopKeywords = async (
  filter: "week" | "month" | null = null,
  limit: number = 10
) => {
  let dateThreshold: Date | undefined;

  if (filter === "week") {
    dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 7);
  } else if (filter === "month") {
    dateThreshold = new Date();
    dateThreshold.setMonth(dateThreshold.getMonth() - 1);
  }

  const keywords = await prisma.keywordUsage.groupBy({
    by: ['keyword'],
    where: dateThreshold
      ? { createdAt: { gte: dateThreshold } }
      : undefined,
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

