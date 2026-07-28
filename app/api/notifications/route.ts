/**
 * app/api/notifications/route.ts
 *
 * GET /api/notifications
 *
 * Returns the authenticated user's notifications (newest first)
 * plus an unread count, with cursor-based pagination.
 *
 * Query params:
 *   cursor?  — last notification id from previous page
 *   limit?   — page size, default 20, max 50
 *   unread?  — "true" to filter unread only
 *
 * Responses:
 *   200  { notifications, unreadCount, nextCursor, hasMore }
 *   401  Not authenticated
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const unreadOnly = searchParams.get("unread") === "true";
    const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
    const limit = Math.min(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, MAX_LIMIT);

    // Run list query and unread count in parallel
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: {
          recipientId: authUser.id,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          channel: true,
          read: true,
          deliveredAt: true,
          readAt: true,
          createdAt: true,
        },
      }),
      db.notification.count({
        where: { recipientId: authUser.id, read: false },
      }),
    ]);

    const hasMore = notifications.length > limit;
    const page = hasMore ? notifications.slice(0, limit) : notifications;

    return NextResponse.json(
      {
        notifications: page,
        unreadCount,
        nextCursor: hasMore ? page[page.length - 1].id : null,
        hasMore,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
