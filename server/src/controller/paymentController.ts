// src/controllers/paymentController.ts
import { Request, Response } from "express";
import { getUser } from "../services/authService";
import {
  confirmPaymentManually,
  createPaymentIntent,
  getAllPaymentsPaginated,
  getPaymentsByUserIdPaginated,
} from "../services/paymentService";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
    });

    // Get global statistics based on the same filters but without pagination
    const allPayments = await getAllPaymentsForStats({
      startDate,
      endDate,
      status,
    });
    console.log(
      "All payments for statistics:",
      allPayments.length,
      "results",
      result.payments.length
    );

    // Calculate statistics from all matching payments
    const stats = calculatePaymentStatistics(allPayments);

    return res.status(200).json({
      data: result.payments,
      metadata: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total,
        itemsPerPage: limit,
      },
      statistics: stats,
    });
  } catch (error: any) {
    console.error("Error getting payments:", error);
    return res.status(500).json({ error: error.message });
  }
}

// New function to get all payments for statistics (without pagination)
async function getAllPaymentsForStats({
  startDate,
  endDate,
  status,
}: {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  // Build the where clause for filtering
  const where: any = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      // Add 1 day to include the end date fully
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      where.createdAt.lt = adjustedEndDate;
    }
  }

  if (status) {
    where.status = status;
  }

  // Get all payments that match the filters, without pagination
  const payments = await prisma.payment.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments;
}
function calculatePaymentStatistics(payments: any[]) {
  console.log("Calculating statistics for", payments.length, "payments");

  // Log the payment amounts to verify data
  payments.forEach((payment, index) => {
    console.log(
      `Payment ${index + 1}: Status=${payment.status}, Amount=${payment.amount}`
    );
  });

  // Ensure we're working with numeric amounts
  const totalRevenue = payments
    .filter((payment) => payment.status === "SUCCEEDED")
    .reduce((sum, payment) => {
      // Convert to number explicitly and handle potential missing/invalid values
      const amount =
        typeof payment.amount === "string"
          ? parseFloat(payment.amount)
          : payment.amount || 0;

      console.log(`Adding ${amount} to revenue sum (currently ${sum})`);
      return sum + amount;
    }, 0);

  console.log("Final calculated totalRevenue:", totalRevenue);

  const totalAmount = payments.reduce((sum, payment) => {
    const amount =
      typeof payment.amount === "string"
        ? parseFloat(payment.amount)
        : payment.amount || 0;
    return sum + amount;
  }, 0);

  const successCount = payments.filter(
    (payment) => payment.status === "SUCCEEDED"
  ).length;

  const failedCount = payments.filter(
    (payment) => payment.status === "FAILED"
  ).length;

  const pendingCount = payments.filter(
    (payment) => payment.status === "PENDING"
  ).length;

  const totalCount = payments.length;

  return {
    totalRevenue,
    totalAmount,
    successCount,
    failedCount,
    pendingCount,
    totalCount,
    successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
    failureRate: totalCount > 0 ? (failedCount / totalCount) * 100 : 0,
    pendingRate: totalCount > 0 ? (pendingCount / totalCount) * 100 : 0,
  };
}
