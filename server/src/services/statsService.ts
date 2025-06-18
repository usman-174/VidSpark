
// src/services/statsService.ts
import { PrismaClient } from "@prisma/client"; // adjust path if needed
const prisma = new PrismaClient();

export async function incrementFeatureUsage(feature: string): Promise<void> {
  try {
    // Increment total count
    await prisma.featureUsage.upsert({
      where: { feature },
      update: { totalCount: { increment: 1 } },
      create: { feature, totalCount: 1 },
    });

    // ✅ Insert usage log
    await prisma.featureUsageLog.create({
      data: { feature },
    });
  } catch (error) {
    console.error(`❌ Failed to increment usage for feature "${feature}"`, error);
  }
}

export const getFeatureUsageCountByRange = async (interval: string) => {
  console.log("🔍 Running feature usage query for interval:", interval);

  const result = await prisma.$queryRawUnsafe<{ feature: string; count: number }[]>(
    `SELECT 
      feature,
      COUNT(*)::INTEGER as count
     FROM "FeatureUsageLog"
     WHERE "usedAt" >= NOW() - INTERVAL '${interval}'
     GROUP BY feature
     ORDER BY count DESC`
  );

  console.log("📊 Feature usage result:", result);
  return result;
};
