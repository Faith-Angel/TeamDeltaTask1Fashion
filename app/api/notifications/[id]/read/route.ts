/**
 * app/api/notifications/[id]/read/route.ts
 *
 * PATCH /api/notifications/:id/read
 *
 * Marks a single notification as read.
 * Only the notification's recipient can mark it read.
 *
 * Responses:
 *   200  { notification }
 *   401  Not authenticated
 *   403  Not the recipient
 *   404  Notification not found
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const { id } = await params;

    const existing = await db.notification.findUnique({
      where: { id },
      select: { id: true, recipientId: true, read: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (existing.recipientId !== authUser.id) {
      return NextResponse.json(
        { error: "You can only mark your own notifications as read.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // No-op if already read — still return 200
    if (existing.read) {
      return NextResponse.json({ notification: existing }, { status: 200 });
    }

    const notification = await db.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ notification }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
