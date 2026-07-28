/**
 * lib/validations/vendor.ts
 *
 * Zod schemas for vendor catalog inputs.
 */

import { z } from "zod";
import { ListingCategory } from "@prisma/client";

// ── Listing image (already uploaded via /api/uploads) ─────────────────────────

const listingImageSchema = z.object({
  url: z.string().url({ message: "Image url must be a valid URL" }),
  storagePath: z.string().min(1, { message: "storagePath is required" }),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024, { message: "Listing images must be 5 MB or smaller" }),
});

// ── Create listing ─────────────────────────────────────────────────────────────

export const createListingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be 100 characters or fewer" }),

  category: z.nativeEnum(ListingCategory, {
    errorMap: () => ({
      message:
        "Category must be clothes, accessories, shoes, or hairstyle_products_services",
    }),
  }),

  description: z
    .string()
    .trim()
    .min(1, { message: "Description is required" })
    .max(1000, { message: "Description must be 1000 characters or fewer" }),

  // Price in XAF stored as integer (e.g. 5000 = 5000 XAF)
  priceXAF: z
    .number()
    .int({ message: "Price must be a whole number in XAF" })
    .min(1, { message: "Price must be at least 1 XAF" })
    .max(99_999_999, { message: "Price must be under 100,000,000 XAF" }),

  images: z
    .array(listingImageSchema)
    .min(1, { message: "At least 1 image is required" })
    .max(10, { message: "Maximum 10 images allowed" }),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// ── Update listing (all fields optional) ──────────────────────────────────────

export const updateListingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  category: z.nativeEnum(ListingCategory).optional(),

  description: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional(),

  priceXAF: z
    .number()
    .int()
    .min(1)
    .max(99_999_999)
    .optional(),

  // When updating images, the caller sends the full new set.
  // Old images not in the new set will be deleted from storage.
  images: z
    .array(listingImageSchema)
    .min(1)
    .max(10)
    .optional(),
});

export type UpdateListingInput = z.infer<typeof updateListingSchema>;
