import { Request, Response } from 'express';
import { fetchAndSaveIdeasOfTheDay, getIdeasOfTheDayByDate } from '../services/ideaService';

/**
 * Automatically fetches news and generates ideas of the day using AI.
 * This is used with a cron job and optionally on server startup.
 */
export const autoFetchIdeasOfTheDay = async () => {
  try {
    console.log('🚀 Auto fetching and generating ideas of the day...');
    const ideas = await fetchAndSaveIdeasOfTheDay();
    console.log(`✅ Successfully generated ${ideas.length} ideas of the day.`);
    return ideas;
  } catch (err) {
    console.error('❌ Failed auto-fetch ideas of the day:', err);
    throw err;
  }
};

/**
 * Returns the latest ideas of the day (up to 8).
 * Expected query: /ideas/show
 */
export const showIdeasOfTheDay = async (req: Request, res: Response) => {
  try {
    const ideas = await getIdeasOfTheDayByDate();
    
    // Format the response for better frontend consumption
    const formattedIdeas = ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      originalNews: idea.originalNews,
      link: idea.link,
      keywords: idea.keywords,
      pubDate: idea.pubDate,
      createdAt: idea.createdAt,
    }));

    res.json({ 
      success: true, 
      ideas: formattedIdeas,
      count: formattedIdeas.length,
    });
  } catch (error) {
    console.error('❌ Failed to fetch ideas of the day:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get ideas of the day',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Manually trigger the generation of ideas of the day.
 * This endpoint can be called to refresh ideas without waiting for cron.
 * POST /ideas/generate
 */
export const generateIdeasOfTheDay = async (req: Request, res: Response) => {
  try {
    console.log('🎯 Manual generation of ideas of the day triggered');
    const ideas = await fetchAndSaveIdeasOfTheDay();
    
    res.json({
      success: true,
      message: `Successfully generated ${ideas.length} new ideas of the day`,
      ideas: ideas.map(idea => ({
        id: idea.id,
        title: idea.title,
        originalNews: idea.originalNews,
        keywords: idea.keywords,
      })),
      count: ideas.length,
    });
  } catch (error) {
    console.error('❌ Failed to manually generate ideas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ideas of the day',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};