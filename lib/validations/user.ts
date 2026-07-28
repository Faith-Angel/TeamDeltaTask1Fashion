/**
 * lib/validations/user.ts
 *
 * Zod schemas for user profile inputs.
 */

import { z } from "zod";

// ── Update profile ─────────────────────────────────────────────────────────────
// All fields are optional — client only sends what changed (PATCH semantics).

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: "Full name cannot be empty" })
    .max(100, { message: "Full name must be 100 characters or fewer" })
    .optional(),

  location: z
    .string()
    .trim()
    .min(1, { message: "Location cannot be empty" })
    .max(100, { message: "Location must be 100 characters or fewer" })
    .optional(),

  pushToken: z
    .string()
    .trim()
    .max(500, { message: "Push token is too long" })
    .optional()
    .nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
