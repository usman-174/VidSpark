import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        role: "USER", // Adjust this condition if you track active users differently
      },
    });
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    
    res.status(200).json({
      totalUsers,
      activeUsers,
      newUsersToday,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error });
  }
};

export const getInvitationStats = async (req: Request, res: Response) => {
  try {
    const totalInvitations = await prisma.invitation.count();
    const usedInvitations = await prisma.invitation.count({
      where: { isUsed: true },
    });
    const pendingInvitations = totalInvitations - usedInvitations;
    
    res.status(200).json({
      totalInvitations,
      usedInvitations,
      pendingInvitations,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching invitation stats", error });
  }
};

export const getCreditStats = async (req: Request, res: Response) => {
  try {
    const totalCreditsGiven = await prisma.credit.aggregate({
      _sum: { credits: true },
    });

    const policyStats = await prisma.policy.findMany({
      select: {
        type: true,
        credits: true,
      },
    });

    res.status(200).json({
      totalCreditsGiven: totalCreditsGiven._sum.credits || 0,
      policyStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching credit stats", error });
  }
};

export const getUserGrowthStats = async (req: Request, res: Response) => {
    try {
      const userGrowth = await prisma.$queryRaw<
        { date: Date; count: number }[]
      >`
        SELECT
          DATE("createdAt") as date,
          CAST(COUNT(*) AS INTEGER) as count
        FROM "User"
        GROUP BY date
        ORDER BY date ASC;
      `;
  
      res.status(200).json(userGrowth);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user growth stats", error: error.message });
    }
  };
  export const getUserDomainStats = async (req: Request, res: Response) => {
    try {
      const domainStats = await prisma.$queryRaw<
        { domain: string; count: number }[]
      >`
        SELECT 
          SPLIT_PART(email, '@', 2) AS domain, 
          CAST(COUNT(*) AS INTEGER) AS count
        FROM "User"
        GROUP BY domain
        ORDER BY count DESC;
      `;
  
      res.status(200).json(domainStats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user domain stats", error: error.message });
    }
  };
  