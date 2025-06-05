
// rc/services/statsService.ts
import { PrismaClient } from "@prisma/client"; // adjust path if needed
const prisma = new PrismaClient();
export async function incrementFeatureUsage(feature: string): Promise<void> {
  try {
    await prisma.featureUsage.upsert({
      where: { feature },
      update: { count: { increment: 1 } },
      create: { feature, count: 1 },
    });
  } catch (error) {
    console.error(`❌ Failed to increment usage for feature "${feature}"`, error);
  }
}
