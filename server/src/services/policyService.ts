// server/src/services/policyService.ts
import { PrismaClient, PolicyType } from '@prisma/client';

const prisma = new PrismaClient();

// Get all policies
export const getAllPolicies = async () => {
  try {
    return await prisma.policy.findMany();
  } catch (error) {
    throw new Error('Error fetching policies: ' + error.message);
  }
};

// Create a new policy
export const createNewPolicy = async (credits: number, type: PolicyType) => {
  try {
    return await prisma.policy.create({
      data: { credits, type },
    });
  } catch (error) {
    throw new Error('Error creating policy: ' + error.message);
  }
};

// Get a policy by its ID
export const getPolicyById = async (id: string) => {
  try {
    return await prisma.policy.findUnique({
      where: { id },
    });
  } catch (error) {
    throw new Error('Error fetching policy by ID: ' + error.message);
  }
};

// Update policy credits
export const updatePolicyCredits = async (id: string, credits: number) => {
  try {
    return await prisma.policy.update({
      where: { id },
      data: { credits },
    });
  } catch (error) {
    throw new Error('Error updating policy credits: ' + error.message);
  }
};
