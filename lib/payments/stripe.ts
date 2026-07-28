/**
 * lib/payments/stripe.ts
 *
 * Stripe payment client.
 *
 * Docs: https://docs.stripe.com/api/payment_intents
 *
 * Flow (Payment Intents):
 *   1. Create a PaymentIntent → return client_secret to the frontend
 *   2. Frontend confirms the card payment via Stripe.js
 *   3. Stripe sends a webhook (payment_intent.succeeded / .payment_failed) to
 *      /api/payments/callback
 *   4. We verify the webhook and update the order
 */

import Stripe from "stripe";

// ── Config ────────────────────────────────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StripeCreateIntentParams {
  /**
   * Amount in XAF (integer). XAF is a zero-decimal currency for Stripe,
   * so this is passed to the API as-is — no ×100 cents conversion.
   */
  amountXAF: number;
  /** Internal reference ID (our Transaction.id) */
  externalId: string;
  /** Optional existing Stripe customer to attach the intent to */
  customerId?: string;
  description: string;
  receiptEmail?: string;
}

export interface StripeCreateIntentResult {
  accepted: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export interface StripePaymentStatus {
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  chargeId?: string;
  receiptUrl?: string;
  reason?: string;
}

// ── Create PaymentIntent ─────────────────────────────────────────────────────

export async function stripeCreatePaymentIntent(
  params: StripeCreateIntentParams
): Promise<StripeCreateIntentResult> {
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: params.amountXAF, // zero-decimal currency — no conversion
        currency: "xaf",
        customer: params.customerId,
        description: params.description,
        receipt_email: params.receiptEmail,
        metadata: { transactionId: params.externalId },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: params.externalId } // safe to retry without double-charging
    );

    return {
      accepted: true,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { accepted: false, error: msg };
  }
}

// ── Get PaymentIntent status ──────────────────────────────────────────────────

export async function stripeGetPaymentStatus(
  paymentIntentId: string
): Promise<StripePaymentStatus> {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    const charge = intent.latest_charge as Stripe.Charge | null;

    const statusMap: Record<string, StripePaymentStatus["status"]> = {
      succeeded: "SUCCESSFUL",
      processing: "PENDING",
      requires_payment_method: "FAILED",
      requires_confirmation: "PENDING",
      requires_action: "PENDING",
      canceled: "FAILED",
      requires_capture: "PENDING",
    };

    return {
      status: statusMap[intent.status] ?? "FAILED",
      chargeId: charge?.id,
      receiptUrl: charge?.receipt_url ?? undefined,
      reason: charge?.failure_message ?? undefined,
    };
  } catch (err) {
    return { status: "FAILED", reason: err instanceof Error ? err.message : String(err) };
  }
}

// ── Refund ─────────────────────────────────────────────────────────────────────

export async function stripeRefundPayment(
  paymentIntentId: string,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
    });
    return { success: true, refundId: refund.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Webhook event parsing ─────────────────────────────────────────────────────

/**
 * Verifies and parses a Stripe webhook using Stripe's own signature scheme
 * (replaces the custom HMAC verification used for MoMo/Orange Money).
 */
export function stripeConstructWebhookEvent(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}