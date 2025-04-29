// server/src/controllers/policyController.ts
import { Request, Response } from 'express';
import * as policyService from '../services/policyService';
import { PolicyType } from '@prisma/client';  // Import PolicyType from Prisma
import * as policyController from '../controller/policyController';  // This is correct if `policyController.ts` is inside the `controller` folder


// Type for the request body in createPolicy
interface CreatePolicyRequest {
  credits: number;
  type: PolicyType;  // Make sure to use PolicyType from Prisma
}

// Type for the request params in getPolicyById
interface GetPolicyByIdParams {
  id: string;
}
// Update credits for a policy
export const updatePolicyCredits = async (req: Request<{ id: string }, {}, { credits: number }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { credits } = req.body;

  if (typeof credits !== 'number' || credits < 0) {
    res.status(400).json({ message: 'Invalid credits value' });
    return;
  }

  try {
    const updatedPolicy = await policyService.updatePolicyCredits(id, credits);
    if (!updatedPolicy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }
    res.json(updatedPolicy);
  } catch (error) {
    res.status(500).json({ message: 'Error updating policy credits', error: error.message });
  }
};

// Get all policies
export const getPolicies = async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = await policyService.getAllPolicies();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policies', error: error.message });
  }
};

// Create a new policy
export const createPolicy = async (req: Request<{}, {}, CreatePolicyRequest>, res: Response): Promise<void> => {
  const { credits, type } = req.body;

  // Validate the type to be a valid PolicyType
  if (!Object.values(PolicyType).includes(type)) {
    res.status(400).json({ message: 'Invalid policy type' });
    return;
  }

  try {
    const newPolicy = await policyService.createNewPolicy(credits, type);
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(500).json({ message: 'Error creating policy', error: error.message });
  }
};

// Get a policy by its ID
export const getPolicyById = async (req: Request<GetPolicyByIdParams, {}, {}>, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const policy = await policyService.getPolicyById(id);
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy', error: error.message });
  }
};
