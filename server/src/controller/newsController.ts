import { Request, Response } from 'express';
import { fetchAndSaveNewsIdeas, getNewsIdeasByDate } from '../services/newsService';

/**
 * Automatically fetches and saves top news ideas from the RSS feed.
 * This is used with a cron job and optionally on server startup.
 */
export const autoFetchNewsIdeas = async () => {
  try {
    console.log('🚀 Auto fetching news ideas...');
    await fetchAndSaveNewsIdeas();
    console.log('✅ News ideas fetched and saved.');
  } catch (err) {
    console.error('❌ Failed auto-fetch:', err);
  }
};

/**
 * Returns news ideas for a given date.
 * If no date is provided, returns today's news ideas.
 * Expected query: /news/show?date=YYYY-MM-DD
 */
export const showNewsIdeas = async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const ideas = await getNewsIdeasByDate(date);
    res.json({ success: true, news: ideas }); // standardize the key as `news`
  } catch (error) {
    console.error('❌ Failed to fetch ideas:', error);
    res.status(500).json({ success: false, error: 'Failed to get ideas' });
  }
};
