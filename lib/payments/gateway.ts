/**
 * lib/payments/gateway.ts
 *
 * Unified payment gateway — abstracts MTN MoMo and Orange Money behind
 * a single interface used by the API route handlers.
 *
 * Responsibilities:
 *   - Amount validation (1–10,000,000 XAF) BEFORE contacting any provider
 *   - Dispatching to the correct provider client
 *   - Creating/updating Transaction records
 *   - Rolling back Order to Pending on timeout or failure
 *   - HMAC webhook signature verification
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { PaymentProvider, PaymentStatus, OrderStatus } from "@prisma/client";
import { mtnRequestToPay, mtnGetPaymentStatus } from "./mtn";
import { orangeInitiatePayment, orangeGetPaymentStatus } from "./orange";

// ── Constants ──────────────────────────────────────────────────────────────────

export const MIN_PAYMENT_XAF = 1;
export const MAX_PAYMENT_XAF = 10_000_000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InitiatePaymentParams {
  orderId:       string;
  amountXAF:     number;
  provider:      PaymentProvider;
  payerPhone:    string;
  /** Used by Orange Money redirect flows */
  returnUrl?:    string;
  cancelUrl?:    string;
}

export interface InitiatePaymentResult {
  success:           boolean;
  transactionId?:    string;
  providerReference?: string;
  /** Orange Money payment URL for redirect */
  paymentUrl?:       string;
  error?:            string;
  /** True when provider timed out — order rolled back to Pending */
  timedOut?:         boolean;
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
  const { orderId, amountXAF, provider, payerPhone } = params;

  // 1. Validate amount BEFORE contacting provider
  const amountError = validatePaymentAmount(amountXAF);
  if (amountError) {
    return { success: false, error: amountError };
  }

  // 2. Verify order exists and is in Pending payment state
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, totalXAF: true },
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
      provider,
      amountXAF,
      status: PaymentStatus.Pending,
    },
  });

  // 4. Call the provider
  try {
    if (provider === PaymentProvider.mtn_momo) {
      return await handleMtn(transaction.id, amountXAF, payerPhone, orderId);
    } else {
      return await handleOrange(
        transaction.id,
        amountXAF,
        orderId,
        payerPhone,
        params.returnUrl,
        params.cancelUrl
      );
    }
  } catch (err) {
    // Unexpected error — roll back order
    await rollbackOrder(orderId, transaction.id, String(err));
    return { success: false, error: "Payment initiation failed unexpectedly.", timedOut: false };
  }
}

// ── MTN handler ────────────────────────────────────────────────────────────────

async function handleMtn(
  transactionId: string,
  amountXAF:     number,
  payerPhone:    string,
  orderId:       string
): Promise<InitiatePaymentResult> {
  const result = await mtnRequestToPay({
    amountXAF,
    payerPhone,
    externalId:   transactionId,
    payerMessage: "NdoloStitch fashion purchase",
    payeeNote:    `Order ${orderId}`,
  });

  if (!result.accepted) {
    await rollbackOrder(orderId, transactionId, result.error ?? "MTN rejected request");
    return { success: false, error: result.error ?? "MTN payment request failed." };
  }

  // Store the provider reference (MTN referenceId for polling)
  await db.transaction.update({
    where: { id: transactionId },
    data:  { providerReference: result.referenceId },
  });

  return {
    success:           true,
    transactionId,
    providerReference: result.referenceId,
  };
}

// ── Orange handler ─────────────────────────────────────────────────────────────

async function handleOrange(
  transactionId: string,
  amountXAF:     number,
  orderId:       string,
  payerPhone:    string,
  returnUrl?:    string,
  cancelUrl?:    string
): Promise<InitiatePaymentResult> {
  const result = await orangeInitiatePayment({
    amountXAF,
    orderId,
    notifUrl:   `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
    returnUrl:  returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`,
    cancelUrl:  cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    payerPhone,
  });

  if (!result.accepted) {
    await rollbackOrder(orderId, transactionId, result.error ?? "Orange rejected request");
    return { success: false, error: result.error ?? "Orange Money payment request failed." };
  }

  await db.transaction.update({
    where: { id: transactionId },
    data:  { providerReference: result.payToken },
  });

  return {
    success:           true,
    transactionId,
    providerReference: result.payToken,
    paymentUrl:        result.paymentUrl,
  };
}

// ── Rollback ───────────────────────────────────────────────────────────────────

export async function rollbackOrder(
  orderId:       string,
  transactionId: string,
  reason:        string
): Promise<void> {
  await db.$transaction([
    db.transaction.update({
      where: { id: transactionId },
      data:  { status: PaymentStatus.Failed, failureReason: reason },
    }),
    db.order.update({
      where: { id: orderId },
      data:  { paymentStatus: PaymentStatus.Pending, status: OrderStatus.Pending },
    }),
  ]);
}

// ── Confirm payment (called from webhook) ──────────────────────────────────────

export async function confirmPayment(
  transactionId:      string,
  providerReference:  string,
  provider:           PaymentProvider
): Promise<void> {
  await db.$transaction([
    db.transaction.update({
      where: { id: transactionId },
      data: {
        status:             PaymentStatus.Paid,
        providerReference,
        confirmedAt:        new Date(),
      },
    }),
    // Update the order's payment status via the transaction relation
    db.order.updateMany({
      where: { transactions: { some: { id: transactionId } } },
      data:  { paymentStatus: PaymentStatus.Paid, status: OrderStatus.Confirmed },
    }),
  ]);
}

// ── HMAC webhook verification ──────────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature on an incoming provider webhook.
 * The raw request body and the X-Signature header are compared.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[gateway] PAYMENT_WEBHOOK_SECRET is not set");
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
