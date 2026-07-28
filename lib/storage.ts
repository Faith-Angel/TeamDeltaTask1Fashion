/**
 * lib/storage.ts
 *
 * Supabase Storage helpers used across all upload API routes.
 *
 * Bucket layout:
 *   portfolios/          – Designer portfolio images (JPEG/PNG/WEBP, ≤10MB)
 *   listings/            – Vendor listing images (JPEG/PNG/WEBP, ≤5MB)
 *   marketer-files/      – Marketer images (≤10MB) and videos (≤200MB, ≤5min)
 *   workspace-files/     – Collaboration workspace files (JPEG/PNG/WEBP/PDF, ≤10MB)
 *   feed/                – Inspiration feed images (admin only, ≤10MB)
 *
 * All buckets are PUBLIC — files are served via Supabase CDN without auth.
 * RLS policies on the bucket level restrict who can upload/delete.
 *
 * IMPORTANT: Create these buckets manually in Supabase Dashboard →
 * Storage → New bucket before running the app. Set each to "Public".
 */

import { createServiceClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

// ── Bucket names ───────────────────────────────────────────────────────────────

export const BUCKETS = {
  PORTFOLIOS: "portfolios",
  LISTINGS: "listings",
  MARKETER_FILES: "marketer-files",
  WORKSPACE_FILES: "workspace-files",
  FEED: "feed",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

// ── MIME type allowlists ───────────────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"] as const;

// ── Size limits (bytes) ────────────────────────────────────────────────────────

export const SIZE_LIMITS = {
  PORTFOLIO_IMAGE: 10 * 1024 * 1024,   // 10 MB
  LISTING_IMAGE: 5 * 1024 * 1024,      // 5 MB
  MARKETER_IMAGE: 10 * 1024 * 1024,    // 10 MB
  MARKETER_VIDEO: 200 * 1024 * 1024,   // 200 MB
  WORKSPACE_FILE: 10 * 1024 * 1024,    // 10 MB
  FEED_IMAGE: 10 * 1024 * 1024,        // 10 MB
} as const;

// ── Video duration limit ───────────────────────────────────────────────────────

export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes

// ── Validation result ──────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ── Per-bucket validation ──────────────────────────────────────────────────────

export function validatePortfolioImage(
  mimeType: string,
  sizeBytes: number
): FileValidationResult {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return {
      valid: false,
      error: "Portfolio images must be JPEG, PNG, or WEBP.",
    };
  }
  if (sizeBytes > SIZE_LIMITS.PORTFOLIO_IMAGE) {
    return { valid: false, error: "Portfolio images must be 10 MB or smaller." };
  }
  return { valid: true };
}

export function validateListingImage(
  mimeType: string,
  sizeBytes: number
): FileValidationResult {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return {
      valid: false,
      error: "Listing images must be JPEG, PNG, or WEBP.",
    };
  }
  if (sizeBytes > SIZE_LIMITS.LISTING_IMAGE) {
    return { valid: false, error: "Listing images must be 5 MB or smaller." };
  }
  return { valid: true };
}

export function validateMarketerFile(
  mimeType: string,
  sizeBytes: number
): FileValidationResult {
  const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType);
  const isVideo = (ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "Marketer files must be JPEG, PNG, WEBP, MP4, MOV, or WEBM.",
    };
  }
  if (isImage && sizeBytes > SIZE_LIMITS.MARKETER_IMAGE) {
    return { valid: false, error: "Marketer images must be 10 MB or smaller." };
  }
  if (isVideo && sizeBytes > SIZE_LIMITS.MARKETER_VIDEO) {
    return { valid: false, error: "Marketer videos must be 200 MB or smaller." };
  }
  return { valid: true };
}

export function validateWorkspaceFile(
  mimeType: string,
  sizeBytes: number
): FileValidationResult {
  const allowed = [
    ...(ALLOWED_IMAGE_TYPES as readonly string[]),
    ...(ALLOWED_DOCUMENT_TYPES as readonly string[]),
  ];
  if (!allowed.includes(mimeType)) {
    return {
      valid: false,
      error: "Workspace files must be JPEG, PNG, WEBP, or PDF.",
    };
  }
  if (sizeBytes > SIZE_LIMITS.WORKSPACE_FILE) {
    return { valid: false, error: "Workspace files must be 10 MB or smaller." };
  }
  return { valid: true };
}

// ── Storage path generator ─────────────────────────────────────────────────────

/**
 * Generates a unique, collision-resistant storage path for a file.
 * Format: {prefix}/{uuid}.{ext}
 * Example: "designer_abc123/9f4a2b1c-....webp"
 */
export function generateStoragePath(
  prefix: string,
  mimeType: string
): string {
  const ext = mimeTypeToExtension(mimeType);
  return `${prefix}/${uuidv4()}.${ext}`;
}

function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "application/pdf": "pdf",
  };
  return map[mimeType] ?? "bin";
}

// ── Upload helper ──────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  storagePath: string;
}

/**
 * Uploads a file buffer to Supabase Storage and returns the public URL
 * and the storage path (needed for future deletion).
 *
 * Uses the service-role client so uploads work regardless of RLS policies.
 * Access control is enforced at the API route level before calling this.
 */
export async function uploadFile(
  bucket: BucketName,
  storagePath: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  const supabase = await createServiceClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false, // never silently overwrite — paths are UUID-based
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return { url: publicUrl, storagePath };
}

// ── Delete helper ──────────────────────────────────────────────────────────────

/**
 * Deletes a file from Supabase Storage by its storage path.
 * Fails silently if the file does not exist (idempotent).
 */
export async function deleteFile(
  bucket: BucketName,
  storagePath: string
): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.storage.from(bucket).remove([storagePath]);
}
