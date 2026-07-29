/**
 * app/api/auth/login/route.ts
 *
 * POST /api/auth/login
 *
 * Authenticates a returning user with email + password via Supabase Auth.
 *
 * Request body:
 *   { email, password }
 *
 * Responses:
 *   200  { user, session: { accessToken, refreshToken, expiresAt } }
 *   401  Invalid email or password
 *   422  Validation error
 *   423  Account locked
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import {
  checkAccountLock,
  recordFailedAttempt,
  resetFailedAttempts,
  toPublicUser,
} from "@/lib/auth/helpers";
import {
  validationError,
  invalidCredentialsError,
  userNotFoundError,
  accountLockedError,
  internalError,
} from "@/lib/auth/errors";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { email, password } = parsed.data;

    // 2. Look up the Prisma User — must exist for login
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists — return generic error
      return userNotFoundError();
    }

    // 3. Check account lockout before attempting sign in
    const lockedUntil = await checkAccountLock(user.id);
    if (lockedUntil) {
      return accountLockedError(lockedUntil);
    }

    // 4. Sign in with Supabase Auth using email + password
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      // Record the failed attempt — may lock the account
      const newLock = await recordFailedAttempt(user.id);
      if (newLock) {
        return accountLockedError(newLock);
      }
      return invalidCredentialsError();
    }

    // 5. Successful login — reset failed attempts
    await resetFailedAttempts(user.id);

    // 6. Return session and public user
    return NextResponse.json(
      {
        user: toPublicUser(user),
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

