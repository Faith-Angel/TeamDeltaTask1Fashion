/**
 * app/api/marketers/[id]/portfolio/route.ts
 *
 * POST   /api/marketers/:id/portfolio  — add portfolio file (image or video)
 * DELETE /api/marketers/:id/portfolio  — remove portfolio file
 *
 * Both require the authenticated user to be the owning Marketer.
 * Max 50 files total per marketer.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { addMarketerFileSchema } from "@/lib/validations/marketer";
import { deleteFile, BUCKETS } from "@/lib/storage";
import { Role, FileType } from "@prisma/client";

const MAX_PORTFOLIO_FILES = 50;

// ── POST — add file ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Marketer) {
      return NextResponse.json(
        { error: "Only Marketers can add portfolio files.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const profile = await db.marketerProfile.findUnique({
      where: { id },
      select: {
        userId: true,
        _count: { select: { portfolioFiles: true } },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Marketer profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (profile.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only add files to your own portfolio.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (profile._count.portfolioFiles >= MAX_PORTFOLIO_FILES) {
      return NextResponse.json(
        {
          error: `Portfolio is full. Maximum ${MAX_PORTFOLIO_FILES} files allowed.`,
          code: "LIMIT_EXCEEDED",
        },
        { status: 422 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = addMarketerFileSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const file = await db.marketerFile.create({
      data: {
        marketerProfileId: id,
        url:             parsed.data.url,
        storagePath:     parsed.data.storagePath,
        fileType:        parsed.data.fileType === "image" ? FileType.image : FileType.video,
        mimeType:        parsed.data.mimeType,
        sizeBytes:       parsed.data.sizeBytes,
        durationSeconds: parsed.data.durationSeconds ?? null,
      },
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (err) {
    return internalError(String(err));
  }
}

// ── DELETE — remove file ───────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Marketer) {
      return NextResponse.json(
        { error: "Only Marketers can remove portfolio files.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { fileId?: string };

    if (!body.fileId) {
      return NextResponse.json(
        { error: "fileId is required.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const file = await db.marketerFile.findFirst({
      where: { id: body.fileId, marketerProfileId: id },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const profile = await db.marketerProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (profile?.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only remove files from your own portfolio.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await Promise.all([
      db.marketerFile.delete({ where: { id: file.id } }),
      deleteFile(BUCKETS.MARKETER_FILES, file.storagePath),
    ]);

    return NextResponse.json(
      { message: "File removed successfully." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
