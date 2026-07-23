/**
 * app/api/vendor/listings/[id]/stock/route.ts
 *
 * PATCH /api/vendor/listings/:id/stock
 *
 * Toggles the inStock status of a listing:
 *   true  → false  (mark out of stock)
 *   false → true   (mark back in stock)
 *
 * Only the owning Vendor can update stock status.
 *
 * Responses:
 *   200  { id, inStock }
 *   401  Not authenticated
 *   403  Not the owner
 *   404  Listing not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { Role } from "@prisma/client";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can update stock status.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const listing = await db.listing.findFirst({
      where: { id, vendorProfile: { userId: authUser.id } },
      select: { id: true, inStock: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const updated = await db.listing.update({
      where: { id },
      data: { inStock: !listing.inStock },
      select: { id: true, inStock: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
