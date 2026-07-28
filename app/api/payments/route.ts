/**
 * app/api/payments/route.ts
 *
 * POST /api/payments
 *
 * Initiates a Stripe payment for an existing order.
 *
 * Flow:
 *   1. Client creates an order via POST /api/orders (gets back orderId)
 *   2. Client calls this route with { orderId }
 *   3. We call initiatePayment() → creates a Transaction + Stripe PaymentIntent
 *   4. We return { clientSecret, transactionId } to the frontend
 *   5. Frontend uses Stripe.js to confirm the payment with the clientSecret
 *   6. Stripe calls POST /api/payments/webhook on success or failure
 *
 * Responses:
 *   200  { clientSecret, transactionId }
 *   401  Not authenticated
 *   403  Not the order owner
 *   404  Order not found
 *   409  Order payment already initiated or completed
 *   422  Validation error | amount out of range
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { initiatePayment } from "@/lib/payments/gateway";
import { Role } from "@prisma/client";

// ── Validation ─────────────────────────────────────────────────────────────────

const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, "orderId is required."),
  /** Optional receipt email to pass to Stripe */
  receiptEmail: z.string().email("Invalid email address.").optional(),
});

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    // Only Clients place orders and initiate payments
    if (authUser.role !== Role.Client) {
      return NextResponse.json(
        { error: "Only Clients can initiate payments.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = initiatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { orderId, receiptEmail } = parsed.data;

    // Verify the order exists and belongs to this client
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        clientId: true,
        totalXAF: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (order.clientId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only pay for your own orders.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Block if payment already started or completed
    if (order.paymentStatus !== "Pending") {
      return NextResponse.json(
        {
          error: `Payment for this order is already '${order.paymentStatus}'.`,
          code: "CONFLICT",
        },
        { status: 409 }
      );
    }

    // Initiate the payment through the gateway
    const result = await initiatePayment({
      orderId,
      amountXAF: order.totalXAF,
      receiptEmail: receiptEmail ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Payment initiation failed.", code: "PAYMENT_FAILED" },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        clientSecret: result.clientSecret,
        transactionId: result.transactionId,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
