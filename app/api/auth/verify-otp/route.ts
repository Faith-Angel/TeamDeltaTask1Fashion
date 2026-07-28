/**
 * app/api/auth/verify-otp/route.ts
 *
 * POST /api/auth/verify-otp
 *
 * Two flows handled by a single endpoint:
 *
 *   1. REGISTRATION — phone + token + fullName + location + role (+ marketerSubRole)
 *      - Verifies OTP with Supabase
 *      - Checks the phone is not already registered in Prisma
 *      - Creates User + role-specific profile in one transaction
 *      - Returns session + public user object
 *
 *   2. LOGIN — phone + token only
 *      - Verifies OTP with Supabase
 *      - Looks up existing Prisma User record
 *      - Checks account lockout
 *      - Resets failed attempts on success
 *      - Returns session + public user object
 *
 * The client determines which flow to use based on whether registration
 * fields are included in the request body.
 *
 * Responses:
 *   200  { user, session: { accessToken, refreshToken, expiresAt } }
 *   401  Invalid / expired OTP
 *   409  Phone already registered (registration flow)
 *   422  Validation error
 *   423  Account locked  { lockedUntil }
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  verifyOtpRegisterSchema,
  verifyOtpLoginSchema,
} from "@/lib/validations/auth";
import {
  createUserWithProfile,
  checkAccountLock,
  recordFailedAttempt,
  resetFailedAttempts,
  toPublicUser,
} from "@/lib/auth/helpers";
import {
  validationError,
  invalidOtpError,
  phoneInUseError,
  userNotFoundError,
  accountLockedError,
  internalError,
} from "@/lib/auth/errors";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // ── Determine flow: registration vs login ────────────────────────────────
    // If fullName is present we treat it as a registration attempt.
    const isRegistration = Boolean(body.fullName);

    if (isRegistration) {
      return await handleRegistration(body);
    } else {
      return await handleLogin(body);
    }
  } catch (err) {
    return internalError(String(err));
  }
}

// ── Registration flow ──────────────────────────────────────────────────────────

async function handleRegistration(body: unknown) {
  // 1. Validate all registration fields
  const parsed = verifyOtpRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const { phone, token, fullName, location, role, marketerSubRole } =
    parsed.data;

  // 2. Check phone is not already registered in Prisma
  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) {
    return phoneInUseError();
  }

  // 3. Verify the OTP with Supabase Auth
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error || !data.user || !data.session) {
    return invalidOtpError();
  }

  // 4. Create Prisma User + role profile in a transaction
  const user = await createUserWithProfile({
    authId: data.user.id,
    fullName,
    phone,
    location,
    role: role as Role,
    marketerSubRole,
  });

  // 5. Return session and public user
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
}

// ── Login flow ─────────────────────────────────────────────────────────────────

async function handleLogin(body: unknown) {
  // 1. Validate phone + token only
  const parsed = verifyOtpLoginSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const { phone, token } = parsed.data;

  // 2. Look up the Prisma User — must exist for login
  const user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    // Don't reveal whether the phone exists — return generic error
    return userNotFoundError();
  }

  // 3. Check account lockout before attempting OTP verification
  const lockedUntil = await checkAccountLock(user.id);
  if (lockedUntil) {
    return accountLockedError(lockedUntil);
  }

  // 4. Verify OTP with Supabase Auth
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error || !data.user || !data.session) {
    // Record the failed attempt — may lock the account
    const newLock = await recordFailedAttempt(user.id);
    if (newLock) {
      return accountLockedError(newLock);
    }
    return invalidOtpError();
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
}
