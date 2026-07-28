/**
 * app/api/uploads/route.ts
 *
 * POST /api/uploads
 *
 * Accepts a multipart/form-data request containing:
 *   - file:   the file to upload (required)
 *   - bucket: target storage bucket (required)
 *   - prefix: path prefix within the bucket (optional)
 *
 * Validates the file type and size based on the target bucket,
 * uploads to Supabase Storage, and returns the public URL and
 * storage path.
 *
 * The storage path is returned so the caller can persist it in
 * the database (used for future deletion).
 *
 * Responses:
 *   200  { url: string, storagePath: string, mimeType: string, sizeBytes: number }
 *   400  Missing file or invalid form data
 *   401  Not authenticated
 *   403  Not allowed to upload to this bucket
 *   422  Validation error (wrong file type or size)
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import {
  BUCKETS,
  generateStoragePath,
  uploadFile,
  validatePortfolioImage,
  validateListingImage,
  validateMarketerFile,
  validateWorkspaceFile,
  type BucketName,
} from "@/lib/storage";
import { Role } from "@prisma/client";

// ── Bucket → role access map ───────────────────────────────────────────────────

const BUCKET_ALLOWED_ROLES: Record<BucketName, Role[]> = {
  [BUCKETS.PORTFOLIOS]:      [Role.Designer],
  [BUCKETS.LISTINGS]:        [Role.Vendor],
  [BUCKETS.MARKETER_FILES]:  [Role.Marketer],
  [BUCKETS.WORKSPACE_FILES]: [Role.Designer],
  [BUCKETS.FEED]:            [], // admin only — handled separately below
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    // 2. Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart/form-data.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const prefix = (formData.get("prefix") as string | null) ?? authUser.id;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (!bucket || !Object.values(BUCKETS).includes(bucket as BucketName)) {
      return NextResponse.json(
        {
          error: `Invalid bucket. Must be one of: ${Object.values(BUCKETS).join(", ")}`,
          code: "VALIDATION_ERROR",
        },
        { status: 422 }
      );
    }

    const targetBucket = bucket as BucketName;

    // 3. Role-based bucket access check
    const allowedRoles = BUCKET_ALLOWED_ROLES[targetBucket];
    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(authUser.role)
    ) {
      return NextResponse.json(
        {
          error: `Your role (${authUser.role}) is not allowed to upload to the '${targetBucket}' bucket.`,
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 4. Read file metadata
    const mimeType = file.type;
    const sizeBytes = file.size;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 5. Per-bucket file validation
    const validation = validateByBucket(targetBucket, mimeType, sizeBytes);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    // 6. Generate a unique storage path and upload
    const storagePath = generateStoragePath(prefix, mimeType);
    const result = await uploadFile(targetBucket, storagePath, fileBuffer, mimeType);

    return NextResponse.json(
      {
        url: result.url,
        storagePath: result.storagePath,
        mimeType,
        sizeBytes,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}

// ── Per-bucket validation dispatch ────────────────────────────────────────────

function validateByBucket(
  bucket: BucketName,
  mimeType: string,
  sizeBytes: number
) {
  switch (bucket) {
    case BUCKETS.PORTFOLIOS:
      return validatePortfolioImage(mimeType, sizeBytes);
    case BUCKETS.LISTINGS:
      return validateListingImage(mimeType, sizeBytes);
    case BUCKETS.MARKETER_FILES:
      return validateMarketerFile(mimeType, sizeBytes);
    case BUCKETS.WORKSPACE_FILES:
      return validateWorkspaceFile(mimeType, sizeBytes);
    case BUCKETS.FEED:
      return validatePortfolioImage(mimeType, sizeBytes); // same rules as portfolio
    default:
      return { valid: false, error: "Unknown bucket." };
  }
}
