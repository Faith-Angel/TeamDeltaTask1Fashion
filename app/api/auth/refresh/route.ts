/**
 * app/api/auth/refresh/route.ts
 *
 * POST /api/auth/refresh
 *
 * Exchanges a refresh token for a new access token.
 * Called by the frontend Axios interceptor when a 401 is received.
 *
 * Note: In most cases the Supabase middleware (middleware.ts) refreshes
 * the token automatically on every request via updateSession(). This
 * endpoint exists as an explicit fallback for clients that need to
 * proactively refresh (e.g. before a long operation or on app resume).
 *
 * Request body:
 *   { refreshToken: string }
 *
 * Responses:
 *   200  { session: { accessToken, refreshToken, expiresAt } }
 *   401  Invalid or expired refresh token
 *   422  Validation error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { refreshTokenSchema } from "@/lib/validations/auth";
import {
  validationError,
  refreshFailedError,
  internalError,
} from "@/lib/auth/errors";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = refreshTokenSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { refreshToken } = parsed.data;

    // 2. Exchange the refresh token with Supabase Auth
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return refreshFailedError();
    }

    // 3. Return new tokens
    return NextResponse.json(
      {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
