/**
 * app/api/orders/route.ts
 *
 * POST /api/orders
 *
 * Creates an order from the client's cart.
 *
 * Flow:
 *   1. Validate cart items and payment provider
 *   2. Fetch all listings — verify they exist and are inStock
 *   3. Confirm all items belong to the same vendor
 *      (one order = one vendor, per the marketplace model)
 *   4. Compute subtotal and total
 *   5. Validate total is within payment gateway limits (1–10,000,000 XAF)
 *   6. Create Order + OrderItems in a transaction with paymentStatus=Pending
 *   7. Return the order — payment is initiated separately via /api/payments
 *
 * Responses:
 *   201  { order }
 *   400  Items from multiple vendors in one order
 *   401  Not authenticated
 *   403  Not a Client
 *   404  One or more listings not found
 *   409  One or more items out of stock
 *   422  Validation error | total outside payment range
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { createOrderSchema } from "@/lib/validations/order";
import { createNotification } from "@/lib/notifications";
import { Role, NotificationType } from "@prisma/client";

const MIN_ORDER_XAF = 1;
const MAX_ORDER_XAF = 10_000_000;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Client) {
      return NextResponse.json(
        { error: "Only Clients can place orders.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { items, paymentProvider, deliveryFeeXAF } = parsed.data;

    // Fetch all listings in one query
    const listingIds = items.map((i) => i.listingId);
    const listings = await db.listing.findMany({
      where: { id: { in: listingIds } },
      select: {
        id: true,
        name: true,
        priceXAF: true,
        inStock: true,
        vendorProfileId: true,
      },
    });

    // Check all listings exist
    if (listings.length !== listingIds.length) {
      const foundIds = new Set(listings.map((l) => l.id));
      const missing = listingIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        {
          error: `Listings not found: ${missing.join(", ")}`,
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Check all listings are in stock
    const outOfStock = listings.filter((l) => !l.inStock);
    if (outOfStock.length > 0) {
      return NextResponse.json(
        {
          error: `Items out of stock: ${outOfStock.map((l) => l.name).join(", ")}`,
          code: "OUT_OF_STOCK",
        },
        { status: 409 }
      );
    }

    // All items must belong to the same vendor
    const vendorIds = [...new Set(listings.map((l) => l.vendorProfileId))];
    if (vendorIds.length > 1) {
      return NextResponse.json(
        {
          error: "All items in a single order must be from the same vendor.",
          code: "MULTI_VENDOR",
        },
        { status: 400 }
      );
    }

    const vendorProfileId = vendorIds[0];

    // Build a map for quick lookup
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    // Compute subtotal
    const subtotalXAF = items.reduce((sum, item) => {
      const listing = listingMap.get(item.listingId)!;
      return sum + listing.priceXAF * item.quantity;
    }, 0);

    const totalXAF = subtotalXAF + deliveryFeeXAF;

    // Validate total within payment gateway range
    if (totalXAF < MIN_ORDER_XAF || totalXAF > MAX_ORDER_XAF) {
      return NextResponse.json(
        {
          error: `Order total must be between ${MIN_ORDER_XAF} and ${MAX_ORDER_XAF} XAF. Got ${totalXAF} XAF.`,
          code: "VALIDATION_ERROR",
        },
        { status: 422 }
      );
    }

    // Create order in a transaction
    const order = await db.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          clientId: authUser.id,
          vendorProfileId,
          subtotalXAF,
          deliveryFeeXAF,
          totalXAF,
          items: {
            create: items.map((item) => {
              const listing = listingMap.get(item.listingId)!;
              return {
                listingId:    item.listingId,
                name:         listing.name,
                quantity:     item.quantity,
                unitPriceXAF: listing.priceXAF,
              };
            }),
          },
        },
        include: {
          items: true,
          vendorProfile: {
            select: {
              id: true,
              storeName: true,
              userId: true,
              user: { select: { location: true } },
            },
          },
        },
      });
    });

    // Notify the vendor of the new order
    await createNotification({
      recipientId: order.vendorProfile.userId,
      type: NotificationType.order_placed,
      title: "New Order Received",
      body: `${authUser.fullName} placed an order worth ${order.totalXAF.toLocaleString()} XAF.`,
      data: { orderId: order.id },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return internalError(String(err));
  }
}

// ── GET — list client's own orders ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Client) {
      return NextResponse.json(
        { error: "Only Clients can view their orders.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit  = 20;

    const orders = await db.order.findMany({
      where: { clientId: authUser.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        totalXAF: true,
        paymentStatus: true,
        deliveryStatus: true,
        deliveryRef: true,
        createdAt: true,
        items: {
          select: { name: true, quantity: true, unitPriceXAF: true },
        },
        vendorProfile: {
          select: { storeName: true },
        },
      },
    });

    const hasMore = orders.length > limit;
    const page    = hasMore ? orders.slice(0, limit) : orders;

    return NextResponse.json(
      { orders: page, nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
