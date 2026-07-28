/**
 * lib/notifications.ts
 *
 * Helper that creates a Notification row in the database.
 *
 * Usage:
 *   await createNotification({
 *     recipientId: user.id,
 *     type: NotificationType.appointment_request,
 *     title: "New Appointment Request",
 *     body: "Gloria wants to book a fitting.",
 *     data: { appointmentId: "abc123" },
 *   });
 *
 * This is a fire-and-forget helper — it never throws. Errors are
 * logged server-side so a notification failure never breaks the
 * parent request (e.g. creating an order).
 */

import { db } from "@/lib/db";
import {
  NotificationType,
  NotificationChannel,
  Prisma,
} from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** JSON deep-link payload — used by the mobile app for navigation */
  data?: Prisma.InputJsonValue;
  channel?: NotificationChannel;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

/**
 * Writes a Notification row to the database.
 * Returns the created notification, or null if the write fails.
 * Never throws — errors are swallowed and logged.
 */
export async function createNotification(
  params: CreateNotificationParams
) {
  const {
    recipientId,
    type,
    title,
    body,
    data = {},
    channel = NotificationChannel.both,
  } = params;

  try {
    const notification = await db.notification.create({
      data: {
        recipientId,
        type,
        title,
        body,
        data,
        channel,
      },
    });

    return notification;
  } catch (err) {
    // Log but never propagate — a notification write failing should
    // never cause the parent API request to fail.
    console.error("[notifications] Failed to create notification:", err);
    return null;
  }
}
