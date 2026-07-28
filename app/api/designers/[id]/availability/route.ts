/**
 * app/api/designers/[id]/availability/route.ts
 *
 * PATCH /api/designers/:id/availability
 *
 * Toggles the designer's availability status:
 *   Available   → Unavailable
 *   Unavailable → Available
 *   Busy        → Available  (Busy is set by the system; designer can clear it)
 *
 * Only the owning Designer can change their own availability.
 *
 * Responses:
 *   200  { availability: AvailabilityStatus }
 *   401  Not authenticated
 *   403  Not the owner
 *   404  Designer profile not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { Role, AvailabilityStatus } from "@prisma/client";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can update availability.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify ownership — the profile must belong to the authenticated user
    const profile = await db.designerProfile.findUnique({
      where: { id },
      select: { userId: true, availability: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Designer profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (profile.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only update your own availability.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Toggle logic
    const next =
      profile.availability === AvailabilityStatus.Available
        ? AvailabilityStatus.Unavailable
        : AvailabilityStatus.Available;

    const updated = await db.designerProfile.update({
      where: { id },
      data: { availability: next },
      select: { availability: true },
    });

    return NextResponse.json({ availability: updated.availability }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
