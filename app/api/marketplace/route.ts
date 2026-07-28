/**
 * app/api/marketplace/route.ts
 *
 * GET /api/marketplace
 *
 * Public browse endpoint — accessible to authenticated users and guests.
 * Returns paginated listings from all vendors.
 *
 * Query params:
 *   category      — ListingCategory enum filter (optional)
 *   location      — vendor location filter, exact match (optional)
 *   q             — keyword search on listing name (optional)
 *   cursor        — pagination cursor (listing ID)
 *   limit         — page size (default 20, max 50)
 *
 * Only inStock=true listings from published vendors are returned.
 *
 * Responses:
 *   200  { listings, nextCursor, hasMore }
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { internalError } from "@/lib/auth/errors";
import { ListingCategory } from "@prisma/client";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get("category");
    const location = searchParams.get("location")?.trim() ?? undefined;
    const q = searchParams.get("q")?.trim() ?? undefined;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limitParam = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT));
    const limit = Math.min(isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, MAX_LIMIT);

    // Validate category filter
    const validCategories = Object.values(ListingCategory);
    const categoryFilter =
      categoryParam && validCategories.includes(categoryParam as ListingCategory)
        ? (categoryParam as ListingCategory)
        : undefined;

    const listings = await db.listing.findMany({
      where: {
        inStock: true,
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(location
          ? { vendorProfile: { user: { location: { equals: location, mode: "insensitive" } } } }
          : {}),
        ...(q
          ? { name: { contains: q, mode: "insensitive" } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        category: true,
        priceXAF: true,
        inStock: true,
        createdAt: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1, // thumbnail only for the list view
          select: { url: true },
        },
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
            user: { select: { location: true } },
          },
        },
      },
    });

    const hasMore = listings.length > limit;
    const page = hasMore ? listings.slice(0, limit) : listings;

    return NextResponse.json(
      {
        listings: page,
        nextCursor: hasMore ? page[page.length - 1].id : null,
        hasMore,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
