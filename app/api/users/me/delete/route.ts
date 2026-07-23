/**
 * app/api/users/me/delete/route.ts
 *
 * DELETE /api/users/me/delete
 *
 * Permanently deletes the authenticated user's account:
 *   1. Deletes the Prisma User record (cascades to all related records
 *      via onDelete: Cascade in the schema).
 *   2. Deletes the Supabase Auth user via the service-role client
 *      (requires SUPABASE_SERVICE_ROLE_KEY — bypasses RLS).
 *   3. Clears the session cookie.
 *
 * Why a separate /delete route instead of DELETE /api/users/me?
 * Next.js App Router supports DELETE on route handlers but some proxies
 * and older clients strip the body on DELETE requests. A dedicated POST
 * endpoint at /delete is more reliable across environments.
 *
 * This action is irreversible. The client should show a confirmation
 * dialog before calling this endpoint.
 *
 * Responses:
 *   200  { message: string }
 *   401  Not authenticated
 *   500  Internal error
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

export async function DELETE() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    // 1. Delete the Prisma User record — cascades to all related data
    await db.user.delete({
      where: { id: authUser.id },
    });

    // 2. Delete the Supabase Auth user (requires service-role key)
    const serviceClient = await createServiceClient();
    const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(
      authUser.authId
    );

    if (deleteAuthError) {
      // Log but don't block — Prisma record is already gone.
      // A background cleanup can remove orphaned auth users later.
      console.error(
        "[delete-account] Failed to delete Supabase auth user:",
        deleteAuthError.message
      );
    }

    // 3. Sign out to clear session cookies
    const supabase = await createServerClient();
    await supabase.auth.signOut({ scope: "local" });

    return NextResponse.json(
      { message: "Account deleted successfully." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
