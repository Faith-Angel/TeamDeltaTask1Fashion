/**
 * app/api/designers/[id]/portfolio/route.ts
 *
 * POST   /api/designers/:id/portfolio  — add a portfolio image
 * DELETE /api/designers/:id/portfolio  — remove a portfolio image
 *
 * Both require the authenticated user to be the owning Designer.
 *
 * POST expects the image to already be uploaded via /api/uploads.
 * It just records the URL and storagePath in the database.
 * Max 50 images per designer — enforced here.
 *
 * DELETE expects { imageId } in the request body.
 * It removes the database record AND deletes the file from Supabase Storage.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { addPortfolioImageSchema } from "@/lib/validations/designer";
import { deleteFile, BUCKETS } from "@/lib/storage";
import { Role } from "@prisma/client";

const MAX_PORTFOLIO_IMAGES = 50;

// ── POST — add image ───────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can add portfolio images.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const profile = await db.designerProfile.findUnique({
      where: { id },
      select: {
        userId: true,
        _count: { select: { portfolioImages: true } },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Designer profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (profile.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only add images to your own portfolio.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Enforce max 50 images
    if (profile._count.portfolioImages >= MAX_PORTFOLIO_IMAGES) {
      return NextResponse.json(
        {
          error: `Portfolio is full. Maximum ${MAX_PORTFOLIO_IMAGES} images allowed.`,
          code: "LIMIT_EXCEEDED",
        },
        { status: 422 }
      );
    }

    // Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = addPortfolioImageSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const image = await db.portfolioImage.create({
      data: {
        designerProfileId: id,
        url: parsed.data.url,
        storagePath: parsed.data.storagePath,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    return internalError(String(err));
  }
}

// ── DELETE — remove image ──────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can remove portfolio images.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json().catch(() => ({})) as { imageId?: string };
    if (!body.imageId) {
      return NextResponse.json(
        { error: "imageId is required.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Verify the image belongs to this designer profile
    const image = await db.portfolioImage.findFirst({
      where: { id: body.imageId, designerProfileId: id },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify the profile belongs to the authenticated user
    const profile = await db.designerProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (profile?.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only remove images from your own portfolio.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Delete from DB and storage in parallel
    await Promise.all([
      db.portfolioImage.delete({ where: { id: image.id } }),
      deleteFile(BUCKETS.PORTFOLIOS, image.storagePath),
    ]);

    return NextResponse.json(
      { message: "Image removed successfully." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
