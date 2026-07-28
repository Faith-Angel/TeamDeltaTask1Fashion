/**
 * app/api/marketers/[id]/route.ts
 *
 * GET /api/marketers/:id
 *
 * Returns the full marketer profile including:
 *   - All portfolio files (images + videos)
 *   - Current booking status
 *   - Sub-role, location
 *
 * Accessible to authenticated Designers only.
 *
 * Responses:
 *   200  { marketer }
 *   401  Not authenticated
 *   403  Not a Designer
 *   404  Marketer not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { Role } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can view marketer profiles.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const profile = await db.marketerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        subRole: true,
        bookingStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            location: true,
          },
        },
        portfolioFiles: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            url: true,
            fileType: true,
            mimeType: true,
            sizeBytes: true,
            durationSeconds: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Marketer not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ marketer: profile }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
