import { Request, Response } from 'express';
import { fetchAndSaveNewsIdeas, getTodaysNewsIdeas } from '../services/newsService';

export const saveNewsIdeas = async (req: Request, res: Response) => {
  try {
    const saved = await fetchAndSaveNewsIdeas();
    res.json({ success: true, saved });
  } catch (error) {
    console.error('Failed to fetch news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
};

export const showNewsIdeas = async (req: Request, res: Response) => {
  try {
    const ideas = await getTodaysNewsIdeas();
    res.json({ success: true, ideas });
  } catch (error) {
    console.error('Failed to fetch ideas:', error);
    res.status(500).json({ success: false, error: 'Failed to get ideas' });
  }
};
