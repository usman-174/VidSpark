import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Response.locals type
declare global {
  namespace Express {
    interface Locals {
      user: {
        userId: string;
        role: string;
      };
    }
  }
}

export const setUser = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
        role: string;
      };

      res.locals.user = {
        userId: decoded.userId,
        role: decoded.role,
      };

      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

export const restrictTo =
  (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction):any => {
      
      
      if (!res.locals.user || !roles.includes(res.locals.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    };
  };
