/**
 * app/api/users/[id]/route.ts
 *
 * GET /api/users/:id
 *
 * Returns the public-facing profile of any user by their Prisma User ID.
 * Sensitive fields (authId, pushToken, failedLoginAttempts, lockedUntil)
 * are intentionally excluded.
 *
 * This endpoint is accessible to any authenticated user — it's used by
 * the frontend to look up participant names in chats, bookings, etc.
 *
 * Responses:
 *   200  { user }
 *   401  Not authenticated
 *   404  User not found
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
    // Must be signed in to look up other users
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        location: true,
        role: true,
        marketerSubRole: true,
        createdAt: true,
        // Include a thin snapshot of the role-specific profile
        designerProfile: {
          select: {
            id: true,
            availability: true,
            rankingScore: true,
            reviewCount: true,
          },
        },
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
          },
        },
        marketerProfile: {
          select: {
            id: true,
            subRole: true,
            bookingStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
