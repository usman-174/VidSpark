// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { getUser } from "../services/authService";
import {
  confirmPaymentManually,
  createPaymentIntent,
  getAllPaymentsPaginated,
  getPaymentsByUserIdPaginated,
} from "../services/paymentService";

/**
 * POST /payments/intent
 * Body: { creditPackageId: string }
 * Creates a PaymentIntent and returns the clientSecret along with a paymentId.
 */
export async function createPaymentIntentController(
  req: Request,
  res: Response
): Promise<any> {
  try {
    // Assume auth middleware populates res.locals.user with { userId: string }
    let { user } = res.locals;
    const userId = user?.userId;
    const { creditPackageId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!creditPackageId) {
      return res.status(400).json({ error: "Missing creditPackageId" });
    }

    // Retrieve full user details
    user = (await getUser(userId)) as any;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await createPaymentIntent(user, creditPackageId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /payments/confirm
 * Body: { paymentId: string }
 * Manually updates a Payment record to SUCCEEDED and increments the user's credits.
 */
export async function confirmPaymentController(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: "Missing paymentId" });
    }

    const result = await confirmPaymentManually(paymentId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /payments/my
 * Returns all payments made by the current user.
 */
export async function getMyPaymentsController(
  req: Request,
  res: Response
): Promise<any> {
  try {
    // Assume auth middleware populates res.locals.user with { userId: string }
    let { user } = res.locals;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Extract pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get paginated payments and count
    const result = await getPaymentsByUserIdPaginated(userId, page, limit);

    return res.status(200).json({
      data: result.payments,
      metadata: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error("Error getting payments:", error);
    return res.status(500).json({ error: error.message });
  }
}

// For admin dashboard get all transactions with filters,pagination

export async function getAllPaymentsController(
  req: Request,
  res: Response
): Promise<any> {
  try {
    // Assume auth middleware populates res.locals.user with { userId: string, role: string }
    let { user } = res.locals;

    // Extract pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Extract filter parameters
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Get filtered and paginated payments
    const result = await getAllPaymentsPaginated({
      page,
      limit,
      startDate,
      endDate,
      status,
      search,
    });

    return res.status(200).json({
      data: result.payments,
      metadata: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    console.error("Error getting payments:", error);
    return res.status(500).json({ error: error.message });
  }
}
