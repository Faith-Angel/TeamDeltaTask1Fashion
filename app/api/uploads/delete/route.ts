/**
 * app/api/uploads/delete/route.ts
 *
 * DELETE /api/uploads/delete
 *
 * Deletes a file from Supabase Storage by bucket + storagePath.
 * The caller must be authenticated and must own the file
 * (the storagePath prefix matches their user ID).
 *
 * Why not use a dynamic [storagePath] segment?
 * Storage paths contain slashes (e.g. "designer_abc/uuid.jpg") which
 * Next.js dynamic segments don't handle well without catch-all routes.
 * Accepting the path in the request body is simpler and safer.
 *
 * Request body:
 *   { bucket: string, storagePath: string }
 *
 * Responses:
 *   200  { message: string }
 *   400  Missing fields
 *   401  Not authenticated
 *   403  Path does not belong to this user
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";
import { deleteFile, BUCKETS, type BucketName } from "@/lib/storage";

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    // 2. Parse body
    const body = await request.json().catch(() => ({})) as {
      bucket?: string;
      storagePath?: string;
    };

    const { bucket, storagePath } = body;

    if (!bucket || !storagePath) {
      return NextResponse.json(
        { error: "Both 'bucket' and 'storagePath' are required.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (!Object.values(BUCKETS).includes(bucket as BucketName)) {
      return NextResponse.json(
        { error: "Invalid bucket name.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // 3. Ownership check — storage paths are prefixed with the user's ID
    // e.g. "designer_<userId>/uuid.jpg" or just "<userId>/uuid.jpg"
    // We verify the path starts with the authenticated user's ID.
    const normalizedPath = storagePath.replace(/^\/+/, ""); // strip leading slashes
    const pathOwnerId = normalizedPath.split("/")[0];

    if (pathOwnerId !== authUser.id) {
      return NextResponse.json(
        {
          error: "You are not allowed to delete this file.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 4. Delete from Supabase Storage
    await deleteFile(bucket as BucketName, normalizedPath);

    return NextResponse.json(
      { message: "File deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
