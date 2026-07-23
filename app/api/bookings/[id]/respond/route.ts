/**
 * app/api/bookings/[id]/respond/route.ts
 *
 * PATCH /api/bookings/:id/respond
 *
 * Marketer accepts or declines a pending booking request.
 *
 * On ACCEPT:
 *   - Booking status → Confirmed
 *   - Marketer bookingStatus → Busy (blocks new booking requests)
 *
 * On DECLINE:
 *   - Booking status → Declined
 *   - Marketer bookingStatus unchanged (remains Available)
 *
 * Only the Marketer who received the booking can respond.
 * Only bookings in "Pending" status can be responded to.
 *
 * Request body:
 *   { decision: "accept" | "decline" }
 *
 * Responses:
 *   200  { booking }
 *   401  Not authenticated
 *   403  Not the receiving Marketer
 *   404  Booking not found
 *   422  Booking is not in Pending status | Validation error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { bookingResponseSchema } from "@/lib/validations/marketer";
import { Role, BookingStatus, AvailabilityStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Marketer) {
      return NextResponse.json(
        { error: "Only Marketers can respond to booking requests.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = bookingResponseSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { decision } = parsed.data;

    // Fetch booking with marketer profile ownership check
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        marketerProfile: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Ownership check
    if (booking.marketerProfile.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only respond to bookings sent to you.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Only Pending bookings can be responded to
    if (booking.status !== BookingStatus.Pending) {
      return NextResponse.json(
        {
          error: `Booking is already '${booking.status}' and cannot be responded to.`,
          code: "INVALID_TRANSITION",
        },
        { status: 422 }
      );
    }

    if (decision === "accept") {
      // Accept: update booking + set marketer as Busy in one transaction
      const [updated] = await db.$transaction([
        db.booking.update({
          where: { id },
          data: { status: BookingStatus.Confirmed },
        }),
        db.marketerProfile.update({
          where: { id: booking.marketerProfileId },
          data: { bookingStatus: AvailabilityStatus.Busy },
        }),
      ]);

      return NextResponse.json({ booking: updated }, { status: 200 });
    } else {
      // Decline: update booking status only
      const updated = await db.booking.update({
        where: { id },
        data: { status: BookingStatus.Declined },
      });

      return NextResponse.json({ booking: updated }, { status: 200 });
    }
  } catch (err) {
    return internalError(String(err));
  }
}
