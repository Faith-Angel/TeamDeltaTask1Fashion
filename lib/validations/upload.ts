/**
 * lib/validations/upload.ts
 *
 * Zod schemas for file upload API inputs.
 */

import { z } from "zod";
import { BUCKETS } from "@/lib/storage";

// ── Upload request schema ──────────────────────────────────────────────────────

export const uploadSchema = z.object({
  /**
   * Which storage bucket to upload into.
   * The API route validates that the authenticated user is allowed
   * to upload to the requested bucket.
   */
  bucket: z.enum([
    BUCKETS.PORTFOLIOS,
    BUCKETS.LISTINGS,
    BUCKETS.MARKETER_FILES,
    BUCKETS.WORKSPACE_FILES,
    BUCKETS.FEED,
  ]),

  /**
   * Optional path prefix within the bucket.
   * e.g. "designer_<id>" so files are grouped per designer.
   * If omitted, files are stored at the bucket root.
   */
  prefix: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-zA-Z0-9_\-]+$/, {
      message: "Prefix may only contain letters, numbers, underscores, and hyphens.",
    })
    .optional(),
});

export type UploadInput = z.infer<typeof uploadSchema>;
