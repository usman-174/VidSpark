// server/src/routes/policyRoutes.ts
import express from 'express';
import * as policyController from '../controller/policyController';

const router = express.Router();

// Routes for policy management
router.get('/', policyController.getPolicies);  // Get all policies
router.post('/', policyController.createPolicy);  // Create a new policy
router.get('/:id', policyController.getPolicyById);  // Get a policy by ID
router.patch('/:id', policyController.updatePolicyCredits);  // Update policy credits

export default router;
