import { Router } from 'express';
import { showNewsIdeas } from '../controller/newsController';

const router = Router();

router.get('/show', showNewsIdeas); // /api/news/show?date=2025-06-18

export default router;
