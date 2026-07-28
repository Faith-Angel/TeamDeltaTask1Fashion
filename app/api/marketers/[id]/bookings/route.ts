/**
 * app/api/marketers/[id]/bookings/route.ts
 *
 * POST /api/marketers/:id/bookings
 *
 * Designer submits a booking request to a Marketer.
 *
 * Rules (from spec):
 *   - Only Designers can create bookings
 *   - Marketer must not already have an active "Confirmed" booking
 *     (bookingStatus === "Booked" → reject with 409)
 *   - Creates a Booking record with status "Pending"
 *
 * Responses:
 *   201  { booking }
 *   401  Not authenticated
 *   403  Not a Designer
 *   404  Marketer not found
 *   409  Marketer is already booked
 *   422  Validation error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { createBookingSchema } from "@/lib/validations/marketer";
import { Role, AvailabilityStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can submit booking requests.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id: marketerProfileId } = await params;

    // Verify marketer exists and is not already booked
    const marketer = await db.marketerProfile.findUnique({
      where: { id: marketerProfileId },
      select: { id: true, bookingStatus: true },
    });

    if (!marketer) {
      return NextResponse.json(
        { error: "Marketer not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Per spec: reject if marketer has an active Confirmed booking
    if (marketer.bookingStatus === AvailabilityStatus.Busy) {
      return NextResponse.json(
        {
          error: "This marketer is currently booked and not accepting new requests.",
          code: "MARKETER_BOOKED",
        },
        { status: 409 }
      );
    }

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { description, proposedStartDate, proposedEndDate } = parsed.data;

    // Get the designer's profile ID and name
    const designerProfile = await db.designerProfile.findUnique({
      where: { userId: authUser.id },
      select: { id: true },
    });

    if (!designerProfile) {
      return NextResponse.json(
        { error: "Designer profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const booking = await db.booking.create({
      data: {
        designerProfileId: designerProfile.id,
        marketerProfileId,
        designerName:      authUser.fullName,
        description,
        proposedStartDate: new Date(proposedStartDate),
        proposedEndDate:   new Date(proposedEndDate),
      },
      select: {
        id: true,
        status: true,
        description: true,
        proposedStartDate: true,
        proposedEndDate: true,
        createdAt: true,
        marketerProfile: {
          select: {
            id: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    return internalError(String(err));
  }
}
