import { Request, Response } from "express";
import {
  createCreditPackage,
  getCreditPackages,
  getCreditPackageById,
  updateCreditPackage,
  deleteCreditPackage,
  CreditPackageData,
} from "../services/packageService";

/**
 * Create a new credit package.
 */
export const createPackage = async (req: Request, res: Response) => {
  try {
    const { name, credits, price } = req.body;
    const data: CreditPackageData = { name, credits, price };
    const creditPackage = await createCreditPackage(data);
    res
      .status(201)
      .json({ message: "Credit package created successfully", creditPackage });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Retrieve all credit packages.
 */
export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await getCreditPackages();
    res.status(200).json(packages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieve a specific credit package by ID.
 */
export const getPackageById = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const creditPackage = await getCreditPackageById(id);
    if (!creditPackage) {
      return res.status(404).json({ message: "Credit package not found" });
    }
     res.status(200).json(creditPackage);
  } catch (error: any) {
     res.status(500).json({ error: error.message });
  }
};

/**
 * Update an existing credit package.
 */
export const updatePackage = async (req: Request, res: Response) :Promise<any>=> {
  try {
    const { id } = req.params;
    const { name, credits, price } = req.body;
    const updatedPackage = await updateCreditPackage(id, { name, credits, price });
    if (!updatedPackage) {
      return res.status(404).json({ message: "Credit package not found" });
    }
    res
      .status(200)
      .json({ message: "Credit package updated successfully", updatedPackage });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a credit package.
 */
export const deletePackage = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const deleted = await deleteCreditPackage(id);
    if (!deleted) {
      return res.status(404).json({ message: "Credit package not found" });
    }
    res.status(200).json({ message: "Credit package deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
