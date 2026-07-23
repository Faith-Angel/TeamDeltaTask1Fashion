/**
 * lib/validations/order.ts
 *
 * Zod schemas for order creation and delivery updates.
 */

import { z } from "zod";
import { PaymentProvider, DeliveryStatus } from "@prisma/client";

// ── Cart item (sent by client at checkout) ────────────────────────────────────

const cartItemSchema = z.object({
  listingId: z.string().min(1, { message: "listingId is required" }),
  quantity: z
    .number()
    .int()
    .min(1, { message: "Quantity must be at least 1" })
    .max(100, { message: "Quantity cannot exceed 100" }),
});

// ── Create order ──────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z
    .array(cartItemSchema)
    .min(1, { message: "Cart must contain at least one item" })
    .max(50, { message: "Cannot order more than 50 distinct items at once" }),

  paymentProvider: z.nativeEnum(PaymentProvider, {
    errorMap: () => ({
      message: "paymentProvider must be mtn_momo or orange_money",
    }),
  }),

  /** Optional delivery fee in XAF — defaults to 0 if not provided */
  deliveryFeeXAF: z
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .default(0),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ── Update delivery status (vendor) ───────────────────────────────────────────

// Valid delivery transitions:
//   Pending → InTransit
//   InTransit → Delivered

export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.Pending]:   [DeliveryStatus.InTransit],
  [DeliveryStatus.InTransit]: [DeliveryStatus.Delivered],
  [DeliveryStatus.Delivered]: [],
};

export const updateDeliverySchema = z.object({
  deliveryStatus: z.nativeEnum(DeliveryStatus, {
    errorMap: () => ({
      message: "deliveryStatus must be Pending, InTransit, or Delivered",
    }),
  }),
  /** Optional tracking reference to attach when moving to InTransit */
  deliveryRef: z.string().trim().max(200).optional(),
});

export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
