/**
 * app/api/vendor/orders/route.ts
 *
 * GET /api/vendor/orders
 *
 * Returns all orders for the authenticated vendor showing:
 *   - Buyer display name
 *   - Ordered item names and quantities
 *   - Total price
 *   - Payment and delivery status
 *
 * Filterable by deliveryStatus. Cursor-paginated.
 *
 * Responses:
 *   200  { orders, nextCursor, hasMore }
 *   401  Not authenticated
 *   403  Not a Vendor
 *   404  Vendor profile not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { Role, DeliveryStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can view their orders.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: authUser.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Vendor profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const deliveryParam = searchParams.get("deliveryStatus");
    const limit = 20;

    const validDelivery = Object.values(DeliveryStatus);
    const deliveryFilter =
      deliveryParam && validDelivery.includes(deliveryParam as DeliveryStatus)
        ? (deliveryParam as DeliveryStatus)
        : undefined;

    const orders = await db.order.findMany({
      where: {
        vendorProfileId: profile.id,
        ...(deliveryFilter ? { deliveryStatus: deliveryFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        totalXAF: true,
        subtotalXAF: true,
        deliveryFeeXAF: true,
        paymentStatus: true,
        deliveryStatus: true,
        deliveryRef: true,
        createdAt: true,
        client: {
          select: { id: true, fullName: true },
        },
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unitPriceXAF: true,
          },
        },
      },
    });

    const hasMore = orders.length > limit;
    const page = hasMore ? orders.slice(0, limit) : orders;

    return NextResponse.json(
      { orders: page, nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
