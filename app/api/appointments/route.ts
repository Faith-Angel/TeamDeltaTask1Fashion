/**
 * app/api/appointments/route.ts
 *
 * POST /api/appointments
 *
 * Creates a new appointment request from a Client to a Designer.
 * Only Clients can create appointments.
 *
 * Request body:
 *   { designerProfileId: string, notes?: string }
 *
 * Responses:
 *   201  { appointment }
 *   401  Not authenticated
 *   403  Not a Client
 *   404  Designer profile not found
 *   422  Validation error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, validationError, internalError } from "@/lib/auth/errors";
import { createAppointmentSchema } from "@/lib/validations/designer";
import { createNotification } from "@/lib/notifications";
import { Role, NotificationType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    if (authUser.role !== Role.Client) {
      return NextResponse.json(
        { error: "Only Clients can request appointments.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { designerProfileId, notes } = parsed.data;

    // Verify designer profile exists
    const profile = await db.designerProfile.findUnique({
      where: { id: designerProfileId },
      select: { id: true, userId: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Designer profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Create appointment + update pending count in a transaction
    const [appointment] = await db.$transaction([
      db.appointment.create({
        data: {
          clientId: authUser.id,
          designerProfileId,
          notes: notes ?? null,
        },
        select: {
          id: true,
          status: true,
          notes: true,
          requestedAt: true,
          createdAt: true,
          designerProfile: {
            select: {
              id: true,
              user: { select: { fullName: true } },
            },
          },
        },
      }),
      db.designerProfile.update({
        where: { id: designerProfileId },
        data: { pendingAppointmentsCount: { increment: 1 } },
      }),
    ]);

    // Notify the designer of the new appointment request
    await createNotification({
      recipientId: profile.userId,
      type: NotificationType.appointment_request,
      title: "New Appointment Request",
      body: `${authUser.fullName} has requested an appointment with you.`,
      data: { appointmentId: appointment.id },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    return internalError(String(err));
  }
}