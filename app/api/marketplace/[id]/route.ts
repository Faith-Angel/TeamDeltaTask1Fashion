/**
 * app/api/marketplace/[id]/route.ts
 *
 * GET /api/marketplace/:id
 *
 * Returns the full detail for a single marketplace listing including:
 *   - All images (up to 10)
 *   - Full description
 *   - Vendor info (store name, location)
 *   - Stock status
 *
 * Accessible to authenticated users and guests.
 *
 * Responses:
 *   200  { listing }
 *   404  Listing not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { internalError } from "@/lib/auth/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        priceXAF: true,
        inStock: true,
        createdAt: true,
        updatedAt: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 10,
          select: { id: true, url: true, sizeBytes: true },
        },
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
            user: {
              select: { id: true, location: true },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
