import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkVerification = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id; // assume user is attached via token auth

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.isVerified) {
    return res.status(403).json({ error: 'You must verify your email to access this resource.' });
  }

  next();
};
