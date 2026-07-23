/**
 * app/api/appointments/[id]/route.ts
 *
 * GET   /api/appointments/:id  — get single appointment (client or designer)
 * PATCH /api/appointments/:id  — update appointment status (designer only)
 *
 * Valid status transitions (from spec):
 *   Pending     → Attended   (sets attendedAt timestamp)
 *   Pending     → Unattended
 *   Attended    → Delivered  (sets deliveredAt timestamp)
 *
 * Any other transition returns 422.
 * Only the Designer who owns the appointment can update its status.
 *
 * Side effects on status change:
 *   → Attended:   pendingAppointmentsCount decremented
 *   → Delivered:  completedFitsCount incremented
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import {
  updateAppointmentStatusSchema,
  VALID_TRANSITIONS,
} from "@/lib/validations/designer";
import { Role, AppointmentStatus } from "@prisma/client";

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const { id } = await params;

    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true, location: true } },
        designerProfile: {
          select: {
            id: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Only the client or the designer can view the appointment
    const isClient = appointment.clientId === authUser.id;
    const isDesigner = appointment.designerProfile.user.id === authUser.id;

    if (!isClient && !isDesigner) {
      return NextResponse.json(
        { error: "You do not have access to this appointment.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({ appointment }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can update appointment status.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = updateAppointmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { status: newStatus } = parsed.data;

    // Fetch current appointment
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        designerProfile: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (appointment.designerProfile.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only update your own appointments.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[appointment.status];
    if (!allowedNext.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from '${appointment.status}' to '${newStatus}'. Allowed transitions: ${allowedNext.join(", ") || "none"}.`,
          code: "INVALID_TRANSITION",
        },
        { status: 422 }
      );
    }

    // Build update payload with timestamps
    const now = new Date();
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === AppointmentStatus.Attended) {
      updateData.attendedAt = now;
    }
    if (newStatus === AppointmentStatus.Delivered) {
      updateData.deliveredAt = now;
    }

    // Update appointment + designer counters in a transaction
    const designerProfileId = appointment.designerProfileId;

    const [updated] = await db.$transaction([
      db.appointment.update({
        where: { id },
        data: updateData,
      }),
      // Decrement pendingAppointmentsCount when leaving Pending
      ...(appointment.status === AppointmentStatus.Pending
        ? [
            db.designerProfile.update({
              where: { id: designerProfileId },
              data: { pendingAppointmentsCount: { decrement: 1 } },
            }),
          ]
        : []),
      // Increment completedFitsCount when Delivered
      ...(newStatus === AppointmentStatus.Delivered
        ? [
            db.designerProfile.update({
              where: { id: designerProfileId },
              data: { completedFitsCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ appointment: updated }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
