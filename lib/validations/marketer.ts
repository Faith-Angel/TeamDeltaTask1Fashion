/**
 * lib/validations/marketer.ts
 *
 * Zod schemas for marketer portfolio and booking inputs.
 */

import { z } from "zod";
import { MarketerSubRole } from "@prisma/client";

// ── Marketer portfolio file (already uploaded via /api/uploads) ───────────────

export const addMarketerFileSchema = z.object({
  url:         z.string().url({ message: "url must be a valid URL" }),
  storagePath: z.string().min(1, { message: "storagePath is required" }),
  fileType:    z.enum(["image", "video"], {
    errorMap: () => ({ message: "fileType must be image or video" }),
  }),
  mimeType:    z.string().min(1, { message: "mimeType is required" }),
  sizeBytes:   z.number().int().min(1),
  /** Required for video files — duration in seconds (max 300) */
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(300, { message: "Video duration must be 5 minutes or less" })
    .optional(),
});

export type AddMarketerFileInput = z.infer<typeof addMarketerFileSchema>;

// ── Create booking request (Designer → Marketer) ──────────────────────────────

export const createBookingSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1,   { message: "Description is required" })
    .max(500, { message: "Description must be 500 characters or fewer" }),

  proposedStartDate: z
    .string()
    .datetime({ message: "proposedStartDate must be an ISO 8601 datetime" }),

  proposedEndDate: z
    .string()
    .datetime({ message: "proposedEndDate must be an ISO 8601 datetime" }),
}).refine(
  (data) => new Date(data.proposedEndDate) > new Date(data.proposedStartDate),
  {
    message: "proposedEndDate must be after proposedStartDate",
    path: ["proposedEndDate"],
  }
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ── Respond to booking (Marketer accepts or declines) ─────────────────────────

export const bookingResponseSchema = z.object({
  decision: z.enum(["accept", "decline"], {
    errorMap: () => ({ message: "decision must be 'accept' or 'decline'" }),
  }),
});

export type BookingResponseInput = z.infer<typeof bookingResponseSchema>;

// ── Marketer directory filter ──────────────────────────────────────────────────

export const marketerFilterSchema = z.object({
  subRole:  z.nativeEnum(MarketerSubRole).optional(),
  location: z.string().trim().max(100).optional(),
  cursor:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

export type MarketerFilterInput = z.infer<typeof marketerFilterSchema>;
