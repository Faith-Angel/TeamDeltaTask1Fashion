/**
 * lib/validations/designer.ts
 *
 * Zod schemas for designer profile and appointment inputs.
 */

import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";

// ── Portfolio image ────────────────────────────────────────────────────────────

export const addPortfolioImageSchema = z.object({
  /** Public URL returned by /api/uploads */
  url: z.string().url({ message: "url must be a valid URL" }),
  /** Storage path returned by /api/uploads — needed for deletion */
  storagePath: z.string().min(1, { message: "storagePath is required" }),
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "mimeType must be jpeg, png, or webp" }),
  }),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024, { message: "Image must be 10 MB or smaller" }),
});

export type AddPortfolioImageInput = z.infer<typeof addPortfolioImageSchema>;

// ── Appointment creation (Client → Designer) ───────────────────────────────────

export const createAppointmentSchema = z.object({
  /** Prisma ID of the DesignerProfile */
  designerProfileId: z.string().min(1, { message: "designerProfileId is required" }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Notes must be 1000 characters or fewer" })
    .optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ── Appointment status update (Designer only) ──────────────────────────────────

// Valid manual transitions:
//   Pending     → Attended   (Designer marks as attended)
//   Pending     → Unattended (Designer marks as unattended)
//   Attended    → Delivered  (Designer marks as delivered)
// All other transitions are rejected.

export const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> =
  {
    [AppointmentStatus.Pending]: [
      AppointmentStatus.Attended,
      AppointmentStatus.Unattended,
    ],
    [AppointmentStatus.Attended]: [AppointmentStatus.Delivered],
    [AppointmentStatus.Unattended]: [],
    [AppointmentStatus.Delivered]: [],
  };

export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, {
    errorMap: () => ({
      message:
        "status must be Pending, Attended, Unattended, or Delivered",
    }),
  }),
});

export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;
