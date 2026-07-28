/**
 * app/api/payments/webhook/route.ts
 *
 * POST /api/payments/webhook
 *
 * Stripe calls this endpoint after a payment succeeds or fails.
 *
 * Flow:
 *   1. Read the raw request body (must NOT be parsed — Stripe needs the raw bytes)
 *   2. Verify the Stripe-Signature header using STRIPE_WEBHOOK_SECRET
 *   3. Handle the relevant event types:
 *      - payment_intent.succeeded  → confirmPayment() → notify client
 *      - payment_intent.payment_failed → failPayment() → notify client
 *   4. Return 200 quickly — Stripe retries on any non-2xx response
 *
 * IMPORTANT: This route must be excluded from Next.js body parsing.
 * The export config below disables it so we can read the raw body.
 *
 * Stripe dashboard setup:
 *   Endpoint URL : https://your-domain.com/api/payments/webhook
 *   Events to send: payment_intent.succeeded
 *                   payment_intent.payment_failed
 */

import { NextRequest, NextResponse } from "next/server";
import { confirmPayment, failPayment, verifyWebhookSignature } from "@/lib/payments/gateway";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

// Disable Next.js automatic body parsing — Stripe needs the raw bytes
// to verify the webhook signature.
export const config = {
  api: { bodyParser: false },
};

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Read raw body
  const rawBody = await request.text();

  // 2. Verify Stripe signature
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  // 3. Handle event types
  try {
    switch (event.type) {

      // ── Payment succeeded ────────────────────────────────────────────────────
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const transactionId = intent.metadata?.transactionId;

        if (!transactionId) {
          console.warn("[webhook] payment_intent.succeeded missing transactionId metadata");
          break;
        }

        await confirmPayment(transactionId, intent.id);

        // Look up the order's client to send a notification
        const transaction = await db.transaction.findUnique({
          where: { id: transactionId },
          select: {
            order: {
              select: {
                id: true,
                totalXAF: true,
                clientId: true,
              },
            },
          },
        });

        if (transaction?.order) {
          const { id: orderId, totalXAF, clientId } = transaction.order;

          await createNotification({
            recipientId: clientId,
            type: NotificationType.order_status_update,
            title: "Payment Confirmed",
            body: `Your payment of ${totalXAF.toLocaleString()} XAF was successful. Your order is now confirmed.`,
            data: { orderId },
          });
        }

        break;
      }

      // ── Payment failed ───────────────────────────────────────────────────────
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const transactionId = intent.metadata?.transactionId;

        if (!transactionId) {
          console.warn("[webhook] payment_intent.payment_failed missing transactionId metadata");
          break;
        }

        const failureReason =
          intent.last_payment_error?.message ?? "Payment failed.";

        await failPayment(transactionId, failureReason);

        // Look up the order's client to send a notification
        const transaction = await db.transaction.findUnique({
          where: { id: transactionId },
          select: {
            order: {
              select: {
                id: true,
                clientId: true,
              },
            },
          },
        });

        if (transaction?.order) {
          const { id: orderId, clientId } = transaction.order;

          await createNotification({
            recipientId: clientId,
            type: NotificationType.order_status_update,
            title: "Payment Failed",
            body: `Your payment could not be processed. ${failureReason}`,
            data: { orderId },
          });
        }

        break;
      }

      // ── Unhandled event — log and ignore ─────────────────────────────────────
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Log the error but still return 200 — otherwise Stripe will retry
    // indefinitely and spam the logs with duplicate events.
    console.error(`[webhook] Error handling event ${event.type}:`, err);
  }

  // 4. Always return 200 so Stripe knows we received the event
  return NextResponse.json({ received: true }, { status: 200 });
}
