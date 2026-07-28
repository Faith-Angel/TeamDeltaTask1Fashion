/**
 * app/api/vendor/listings/route.ts
 *
 * GET  /api/vendor/listings  — list all of the authenticated vendor's listings
 * POST /api/vendor/listings  — create a new listing
 *
 * Both require the authenticated user to be a Vendor.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { createListingSchema } from "@/lib/validations/vendor";
import { Role } from "@prisma/client";

// ── GET — list vendor's own listings ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can access their listings.", code: "FORBIDDEN" },
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
    const limit = 20;

    const listings = await db.listing.findMany({
      where: { vendorProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    const hasMore = listings.length > limit;
    const page = hasMore ? listings.slice(0, limit) : listings;

    return NextResponse.json(
      { listings: page, nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}

// ── POST — create listing ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can create listings.", code: "FORBIDDEN" },
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

    const body = await request.json().catch(() => ({}));
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { name, category, description, priceXAF, images } = parsed.data;

    const listing = await db.listing.create({
      data: {
        vendorProfileId: profile.id,
        name,
        category,
        description,
        priceXAF,
        images: {
          create: images.map((img, i) => ({
            url: img.url,
            storagePath: img.storagePath,
            sizeBytes: img.sizeBytes,
            sortOrder: i,
          })),
        },
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    return internalError(String(err));
  }
}
