/**
 * lib/payments/gateway.ts
 *
 * Payment gateway — wraps Stripe behind the same interface previously used
 * for MTN MoMo / Orange Money, so callers (API routes) don't need to change.
 *
 * Responsibilities:
 *   - Amount validation BEFORE contacting Stripe
 *   - Creating/updating Transaction records
 *   - Rolling back Order to Pending on failure
 *   - Verifying Stripe webhook signatures
 */

import { db } from "@/lib/db";
import { PaymentProvider, PaymentStatus, OrderStatus } from "@prisma/client";
import {
  stripeCreatePaymentIntent,
  stripeGetPaymentStatus,
  stripeRefundPayment,
  stripeConstructWebhookEvent,
} from "./stripe";
import type Stripe from "stripe";

// ── Constants ──────────────────────────────────────────────────────────────────

// XAF is zero-decimal for Stripe — amounts are whole-number XAF, no cents.
// Stripe enforces a minimum charge equivalent to ~$0.50 USD; ~300 XAF covers
// that with margin. Adjust if Stripe's minimum for XAF changes.
export const MIN_PAYMENT_XAF = 300;
export const MAX_PAYMENT_XAF = 10_000_000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InitiatePaymentParams {
  orderId: string;
  amountXAF: number;
  customerId?: string;
  receiptEmail?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  transactionId?: string;
  /** Client secret for Stripe.js to confirm the card payment */
  clientSecret?: string;
  error?: string;
}

// ── Amount validation ──────────────────────────────────────────────────────────

export function validatePaymentAmount(amountXAF: number): string | null {
  if (!Number.isInteger(amountXAF)) {
    return "Payment amount must be a whole number in XAF.";
  }
  if (amountXAF < MIN_PAYMENT_XAF) {
    return `Payment amount must be at least ${MIN_PAYMENT_XAF} XAF.`;
  }
  if (amountXAF > MAX_PAYMENT_XAF) {
    return `Payment amount must not exceed ${MAX_PAYMENT_XAF} XAF.`;
  }
  return null;
}

// ── Initiate payment ───────────────────────────────────────────────────────────

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const { orderId, amountXAF, customerId, receiptEmail } = params;

  // 1. Validate amount BEFORE contacting Stripe
  const amountError = validatePaymentAmount(amountXAF);
  if (amountError) {
    return { success: false, error: amountError };
  }

  // 2. Verify order exists and is in Pending payment state
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true },
  });

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.paymentStatus !== PaymentStatus.Pending) {
    return { success: false, error: `Order payment is already '${order.paymentStatus}'.` };
  }

  // 3. Create a pending Transaction record
  const transaction = await db.transaction.create({
    data: {
      orderId,
      provider: PaymentProvider.stripe,
      amountXAF,
      status: PaymentStatus.Pending,
    },
  });

  // 4. Create the Stripe PaymentIntent
  try {
    const result = await stripeCreatePaymentIntent({
      amountXAF,
      externalId: transaction.id,
      customerId,
      description: `Order ${orderId}`,
      receiptEmail,
    });

    if (!result.accepted) {
      await rollbackOrder(orderId, transaction.id, result.error ?? "Stripe rejected request");
      return { success: false, error: result.error ?? "Stripe payment intent creation failed." };
    }

    await db.transaction.update({
      where: { id: transaction.id },
      data: { providerReference: result.paymentIntentId },
    });

    return {
      success: true,
      transactionId: transaction.id,
      clientSecret: result.clientSecret,
    };
  } catch (err) {
    await rollbackOrder(orderId, transaction.id, String(err));
    return { success: false, error: "Payment initiation failed unexpectedly." };
  }
}

// ── Rollback ───────────────────────────────────────────────────────────────────

export async function rollbackOrder(
  orderId: string,
  transactionId: string,
  reason: string
): Promise<void> {
  await db.$transaction([
    db.transaction.update({
      where: { id: transactionId },
      data: { status: PaymentStatus.Failed, failureReason: reason },
    }),
    db.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.Pending, status: OrderStatus.Pending },
    }),
  ]);
}

// ── Confirm payment (called from webhook) ──────────────────────────────────────

export async function confirmPayment(
  transactionId: string,
  providerReference: string
): Promise<void> {
  await db.$transaction([
    db.transaction.update({
      where: { id: transactionId },
      data: {
        status: PaymentStatus.Paid,
        providerReference,
        confirmedAt: new Date(),
      },
    }),
    db.order.updateMany({
      where: { transactions: { some: { id: transactionId } } },
      data: { paymentStatus: PaymentStatus.Paid, status: OrderStatus.Confirmed },
    }),
  ]);
}

// ── Mark payment failed (called from webhook) ───────────────────────────────────

export async function failPayment(
  transactionId: string,
  reason: string
): Promise<void> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { orderId: true },
  });
  if (!transaction) return;
  await rollbackOrder(transaction.orderId, transactionId, reason);
}

// ── Refund ─────────────────────────────────────────────────────────────────────

export async function refundPayment(
  transactionId: string,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<{ success: boolean; error?: string }> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { providerReference: true },
  });

  if (!transaction?.providerReference) {
    return { success: false, error: "Transaction has no Stripe payment intent reference." };
  }

  const result = await stripeRefundPayment(transaction.providerReference, reason);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  await db.transaction.update({
    where: { id: transactionId },
    data: { status: PaymentStatus.Refunded },
  });

  return { success: true };
}

// ── Webhook signature verification ──────────────────────────────────────────────

/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 * Throws if the signature is invalid — callers should catch and return 400.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  return stripeConstructWebhookEvent(rawBody, signature);
}