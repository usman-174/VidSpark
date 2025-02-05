import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Response.locals type to include user
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
): void => {  // Middleware function should return void
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

      next(); // Call next to continue the chain
    } catch (err) {
      // Instead of returning a Response object, call next with the error
      return next(new Error("Invalid token"));
    }
  } else {
    // Return an error using next instead of res directly
    return next(new Error("No token provided"));
  }
};

// Restrict access to specific roles
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!res.locals.user || !roles.includes(res.locals.user.role)) {
      return next(new Error("Access denied")); // Use next with error message
    }
    next(); // Continue to the next middleware
  };
};
