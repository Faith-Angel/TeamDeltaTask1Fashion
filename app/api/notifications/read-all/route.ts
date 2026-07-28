/**
 * app/api/notifications/read-all/route.ts
 *
 * PATCH /api/notifications/read-all
 *
 * Marks all of the authenticated user's unread notifications as read
 * in a single bulk update.
 *
 * Responses:
 *   200  { updatedCount }
 *   401  Not authenticated
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

export async function PATCH(_request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const now = new Date();

    const result = await db.notification.updateMany({
      where: { recipientId: authUser.id, read: false },
      data: { read: true, readAt: now },
    });

    return NextResponse.json({ updatedCount: result.count }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}
