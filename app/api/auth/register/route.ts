/**
 * app/api/auth/register/route.ts
 *
 * POST /api/auth/register
 *
 * Registers a new user with email + password via Supabase Auth.
 * Creates the Prisma User record and role-specific profile on success.
 *
 * Request body:
 *   { email, password, fullName, location, role, marketerSubRole? }
 *
 * Responses:
 *   200  { user, session: { accessToken, refreshToken, expiresAt } }
 *   409  Email already registered
 *   422  Validation error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import {
  createUserWithProfile,
  toPublicUser,
} from "@/lib/auth/helpers";
import {
  validationError,
  emailInUseError,
  internalError,
} from "@/lib/auth/errors";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { email, password, fullName, location, role, marketerSubRole } =
      parsed.data;

    // 2. Check email is not already registered in Prisma
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return emailInUseError();
    }

    // 3. Create the Supabase Auth user via ADMIN API (bypasses email sending/rate limit entirely)
    const adminClient = await createServiceClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // mark as confirmed immediately, no email sent
      user_metadata: {
        fullName,
        role,
        location,
      },
    });

    if (error || !data.user) {
      console.error("[register] Supabase error:", error?.message);
      return NextResponse.json(
        {
          error: error?.message ?? "Registration failed. Please try again.",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }

    // 4. Create Prisma User + role profile in a transaction
    const user = await createUserWithProfile({
      authId: data.user.id,
      fullName,
      email,
      location,
      role: role as Role,
      marketerSubRole,
    });

    // 5. Sign in immediately to get a real session (admin.createUser doesn't return one)
    const supabase = await createServerClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      console.error("[register] Sign-in after create error:", signInError?.message);
      // User was created successfully — they can still log in manually
      return NextResponse.json(
        { user: toPublicUser(user), session: null },
        { status: 200 }
      );
    }

    // 6. Return session and public user
    return NextResponse.json(
      {
        user: toPublicUser(user),
        session: {
          accessToken: signInData.session.access_token,
          refreshToken: signInData.session.refresh_token,
          expiresAt: signInData.session.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}