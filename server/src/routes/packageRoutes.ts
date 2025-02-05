import express from "express";
import {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} from "../controller/packageController";

const packageRouter = express.Router();

// Create a new credit package
packageRouter.post("/", createPackage);

// Retrieve all credit packages
packageRouter.get("/", getPackages);

// Retrieve a single credit package by ID
packageRouter.get("/:id", getPackageById);

// Update an existing credit package
packageRouter.put("/:id", updatePackage);

// Delete a credit package
packageRouter.delete("/:id", deletePackage);

export default packageRouter;
