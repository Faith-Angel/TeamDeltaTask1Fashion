/**
 * app/api/vendor/listings/[id]/route.ts
 *
 * PATCH  /api/vendor/listings/:id  — update listing fields
 * DELETE /api/vendor/listings/:id  — delete listing and its images from storage
 *
 * Both require the authenticated Vendor to own the listing.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { updateListingSchema } from "@/lib/validations/vendor";
import { deleteFile, BUCKETS } from "@/lib/storage";
import { Role } from "@prisma/client";

// ── Ownership helper ───────────────────────────────────────────────────────────

async function getOwnedListing(listingId: string, userId: string) {
  return db.listing.findFirst({
    where: {
      id: listingId,
      vendorProfile: { userId },
    },
    include: { images: true },
  });
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can update listings.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const listing = await getOwnedListing(id, authUser.id);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateListingSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { images, ...scalarFields } = parsed.data;

    // If images array provided, replace all images
    if (images) {
      // Delete old images from storage
      await Promise.all(
        listing.images.map((img) => deleteFile(BUCKETS.LISTINGS, img.storagePath))
      );

      const updated = await db.$transaction([
        db.listingImage.deleteMany({ where: { listingId: id } }),
        db.listing.update({
          where: { id },
          data: {
            ...scalarFields,
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
        }),
      ]);

      return NextResponse.json({ listing: updated[1] }, { status: 200 });
    }

    // Scalar-only update
    const updated = await db.listing.update({
      where: { id },
      data: scalarFields,
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ listing: updated }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Vendor) {
      return NextResponse.json(
        { error: "Only Vendors can delete listings.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const listing = await getOwnedListing(id, authUser.id);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Delete all images from storage then delete the DB record (cascade handles images)
    await Promise.all(
      listing.images.map((img) => deleteFile(BUCKETS.LISTINGS, img.storagePath))
    );
    await db.listing.delete({ where: { id } });

    return NextResponse.json(
      { message: "Listing deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
