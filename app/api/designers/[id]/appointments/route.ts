/**
 * app/api/designers/[id]/appointments/route.ts
 *
 * GET /api/designers/:id/appointments
 *
 * Returns all appointments for a designer grouped by status.
 * Only the owning Designer can access this endpoint.
 *
 * Query params:
 *   status  — filter by AppointmentStatus (optional)
 *   cursor  — pagination cursor (appointment ID)
 *   limit   — page size (default 20, max 50)
 *
 * Responses:
 *   200  { appointments, nextCursor, hasMore }
 *   401  Not authenticated
 *   403  Not the owner
 *   404  Designer profile not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { Role, AppointmentStatus } from "@prisma/client";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();
    if (authUser.role !== Role.Designer) {
      return NextResponse.json(
        { error: "Only Designers can view their appointments.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const profile = await db.designerProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Designer profile not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (profile.userId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only view your own appointments.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const cursor = searchParams.get("cursor") ?? undefined;
    const limitParam = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT));
    const limit = Math.min(isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, MAX_LIMIT);

    // Validate status filter
    const validStatuses = Object.values(AppointmentStatus);
    const statusFilter =
      statusParam && validStatuses.includes(statusParam as AppointmentStatus)
        ? (statusParam as AppointmentStatus)
        : undefined;

    const appointments = await db.appointment.findMany({
      where: {
        designerProfileId: id,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // fetch one extra to determine hasMore
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        status: true,
        notes: true,
        requestedAt: true,
        attendedAt: true,
        deliveredAt: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            fullName: true,
            location: true,
          },
        },
      },
    });

    const hasMore = appointments.length > limit;
    const page = hasMore ? appointments.slice(0, limit) : appointments;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return NextResponse.json(
      { appointments: page, nextCursor, hasMore },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
