import { Router } from 'express';
import { saveNewsIdeas, showNewsIdeas } from '../controller/newsController';

const router = Router();

router.get('/save-news', saveNewsIdeas); // You can call this via cron job or button
router.get('/news-ideas', showNewsIdeas); // For frontend to display

export default router;
