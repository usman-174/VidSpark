import Parser from 'rss-parser';
import { PrismaClient } from '@prisma/client';

const parser = new Parser();
const prisma = new PrismaClient(); // Create a single instance

export const fetchAndSaveNewsIdeas = async () => {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=Pakistan&hl=en-PK&gl=PK&ceid=PK:en');

    const existingTitles = new Set(
      (await prisma.newsIdeaTemp.findMany({ select: { title: true } }))
        .map(n => n.title)
    );

    const newsItems = feed.items.slice(0, 10); // Get top 10 news items
    const savedIdeas = [];

    for (const item of newsItems) {
      if (!item.title || existingTitles.has(item.title)) continue;

      const newIdea = await prisma.newsIdeaTemp.create({
        data: {
          title: item.title,
          link: item.link || '',
          pubDate: new Date(item.pubDate || new Date()),
        }
      });

      savedIdeas.push(newIdea);
    }

    return savedIdeas;
  } catch (error) {
    console.error('Error fetching news ideas:', error);
    throw error;
  }
};

export const getTodaysNewsIdeas = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.newsIdeaTemp.findMany({
      where: {
        pubDate: {
          gte: today,
        }
      },
      orderBy: {
        pubDate: 'desc',
      }
    });
  } catch (error) {
    console.error('Error getting today\'s news ideas:', error);
    throw error;
  }
};