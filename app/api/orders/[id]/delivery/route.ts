/**
 * app/api/orders/[id]/delivery/route.ts
 *
 * PATCH /api/orders/:id/delivery
 *
 * Vendor updates the delivery status of an order.
 *
 * Valid transitions:
 *   Pending   → InTransit  (optionally attach deliveryRef tracking number)
 *   InTransit → Delivered
 *
 * Only the Vendor who owns the order can update delivery status.
 * Order must have paymentStatus = Paid before delivery can be updated.
 *
 * Responses:
 *   200  { id, deliveryStatus, deliveryRef }
 *   401  Not authenticated
 *   403  Not the vendor for this order
 *   404  Order not found
 *   422  Invalid transition | Order not yet paid | Validation error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { updateDeliverySchema, DELIVERY_TRANSITIONS } from "@/lib/validations/order";
import { Role, PaymentStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can update delivery status.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const parsed = updateDeliverySchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { deliveryStatus: newStatus, deliveryRef } = parsed.data;

    // Fetch order with vendor ownership check
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        deliveryStatus: true,
        paymentStatus: true,
        vendorProfile: {
          select: { user: { select: { id: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Ownership check
    if (order.vendorProfile.user.id !== authUser.id) {
      return NextResponse.json(
        { error: "You can only update delivery for your own orders.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Must be paid before delivery can be updated
    if (order.paymentStatus !== PaymentStatus.Paid) {
      return NextResponse.json(
        {
          error: "Delivery status can only be updated after payment is confirmed.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 422 }
      );
    }

    // Validate transition
    const allowed = DELIVERY_TRANSITIONS[order.deliveryStatus];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition delivery from '${order.deliveryStatus}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none"}.`,
          code: "INVALID_TRANSITION",
        },
        { status: 422 }
      );
    }

    const updated = await db.order.update({
      where: { id },
      data: {
        deliveryStatus: newStatus,
        ...(deliveryRef ? { deliveryRef } : {}),
      },
      select: { id: true, deliveryStatus: true, deliveryRef: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
