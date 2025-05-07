// server/src/middleware/validatePolicy.ts
import { Request, Response, NextFunction } from 'express';

export const validatePolicy = (req: Request, res: Response, next: NextFunction) => {
  const { credits, type } = req.body;

  if (typeof credits !== 'number' || credits <= 0) {
    return res.status(400).json({ message: 'Credits should be a positive number.' });
  }

  if (!['BASIC', 'PREMIUM', 'ADVANCED'].includes(type)) {
    return res.status(400).json({ message: 'Invalid policy type.' });
  }

  next();
};
