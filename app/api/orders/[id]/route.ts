/**
 * app/api/orders/[id]/route.ts
 *
 * GET /api/orders/:id
 *
 * Returns full order detail including items, payment status, and delivery status.
 * Accessible to the Client who placed the order OR the Vendor who received it.
 *
 * Responses:
 *   200  { order }
 *   401  Not authenticated
 *   403  Not the client or vendor for this order
 *   404  Order not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unitPriceXAF: true,
            listing: {
              select: {
                id: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                  select: { url: true },
                },
              },
            },
          },
        },
        client: {
          select: { id: true, fullName: true, location: true },
        },
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
            user: { select: { id: true, location: true } },
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            provider: true,
            status: true,
            providerReference: true,
            confirmedAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Access control: client or the vendor
    const isClient = order.clientId === authUser.id;
    const isVendor = order.vendorProfile.user.id === authUser.id;

    if (!isClient && !isVendor) {
      return NextResponse.json(
        { error: "You do not have access to this order.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
