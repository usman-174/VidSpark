//src/services/newsService.ts

import Parser from 'rss-parser';
import { PrismaClient } from '@prisma/client';

const parser = new Parser();
const prisma = new PrismaClient();

export const fetchAndSaveNewsIdeas = async () => {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=Pakistan&hl=en-PK&gl=PK&ceid=PK:en');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingTitles = new Set(
      (await prisma.newsIdeaTemp.findMany({
        where: {
          pubDate: {
            gte: today,
          },
        },
        select: { title: true },
      })).map(n => n.title)
    );

    const newsItems = feed.items.slice(0, 10);
    const savedIdeas = [];

    for (const item of newsItems) {
      if (!item.title || existingTitles.has(item.title)) continue;

      const newIdea = await prisma.newsIdeaTemp.create({
        data: {
          title: item.title,
          link: item.link || '',
          pubDate: new Date(item.pubDate || new Date()),
        },
      });

      savedIdeas.push(newIdea);
    }

    return savedIdeas;
  } catch (error) {
    console.error('Error fetching news ideas:', error);
    throw error;
  }
};

export const getNewsIdeasByDate = async (date?: string) => {
  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    return await prisma.newsIdeaTemp.findMany({
      where: {
        pubDate: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: {
        pubDate: 'desc',
      },
    });
  } catch (error) {
    console.error('Error getting ideas by date:', error);
    throw error;
  }
};
