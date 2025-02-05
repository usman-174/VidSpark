import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreditPackageData {
  name: string;
  credits: number;
  price: number;
}

/**
 * Create a new credit package.
 *
 * @param data - The details for the credit package.
 * @returns The created credit package.
 */
export const createCreditPackage = async (data: CreditPackageData) => {
  try {
    const creditPackage = await prisma.creditPackage.create({
      data,
    });
    return creditPackage;
  } catch (error: any) {
    throw new Error(error.message || "Error creating credit package");
  }
};

/**
 * Get all available credit packages.
 *
 * @returns An array of credit packages.
 */
export const getCreditPackages = async () => {
  try {
    const packages = await prisma.creditPackage.findMany();
    return packages;
  } catch (error: any) {
    throw new Error(error.message || "Error fetching credit packages");
  }
};

/**
 * Get a specific credit package by ID.
 *
 * @param id - The ID of the credit package.
 * @returns The found credit package or null if not found.
 */
export const getCreditPackageById = async (id: string) => {
  try {
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id },
    });
    return creditPackage;
  } catch (error: any) {
    throw new Error(error.message || "Error fetching credit package");
  }
};

/**
 * Update a credit package.
 *
 * @param id - The ID of the credit package to update.
 * @param data - The updated data.
 * @returns The updated credit package or null if not found.
 */
export const updateCreditPackage = async (
  id: string,
  data: Partial<CreditPackageData>
) => {
  try {
    const creditPackage = await prisma.creditPackage.update({
      where: { id },
      data,
    });
    return creditPackage;
  } catch (error: any) {
    // Prisma throws a P2025 error if no record is found
    if (error.code === "P2025") {
      return null;
    }
    throw new Error(error.message || "Error updating credit package");
  }
};

/**
 * Delete a credit package.
 *
 * @param id - The ID of the credit package to delete.
 * @returns True if deletion was successful, or false if not found.
 */
export const deleteCreditPackage = async (id: string) => {
  try {
    await prisma.creditPackage.delete({
      where: { id },
    });
    return true;
  } catch (error: any) {
    // If no record is found, Prisma will throw error code P2025.
    if (error.code === "P2025") {
      return false;
    }
    throw new Error(error.message || "Error deleting credit package");
  }
};
