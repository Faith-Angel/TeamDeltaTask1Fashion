/**
 * app/api/auth/session/route.ts
 *
 * GET /api/auth/session
 *
 * Returns the current authenticated user and session metadata.
 * Used by the frontend on app load to restore the session state
 * without requiring re-authentication.
 *
 * The Supabase middleware (middleware.ts) has already refreshed the
 * access token before this handler runs, so the session returned
 * here is always fresh.
 *
 * Responses:
 *   200  { user, session: { accessToken, expiresAt } }
 *   401  No active session
 *   500  Internal error
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { toPublicUser } from "@/lib/auth/helpers";
import { unauthorizedError, internalError } from "@/lib/auth/errors";

export async function GET() {
  try {
    // 1. Get the Supabase auth user (validated server-side, not from cookie alone)
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return unauthorizedError();
    }

    // 2. Fetch the Prisma User record
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
    });

    if (!user) {
      // Auth user exists in Supabase but Prisma record is missing.
      // This can happen if registration was interrupted after OTP verification
      // but before the Prisma transaction completed.
      return unauthorizedError();
    }

    // 3. Get the current session for token metadata
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return NextResponse.json(
      {
        user: toPublicUser(user),
        session: session
          ? {
              accessToken: session.access_token,
              expiresAt: session.expires_at,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
