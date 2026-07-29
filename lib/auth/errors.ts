/**
 * lib/auth/errors.ts
 *
 * Standardised auth error responses.
 * All auth API routes return errors in this shape so the frontend
 * can handle them consistently.
 */

import { NextResponse } from "next/server";

// ── Error shape ────────────────────────────────────────────────────────────────

export interface AuthErrorResponse {
  error: string;
  code: AuthErrorCode;
  /** Field-level validation errors from Zod */
  fieldErrors?: Record<string, string[]>;
  /** ISO timestamp of when the lockout expires */
  lockedUntil?: string;
}

export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_IN_USE"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "ACCOUNT_LOCKED"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "REFRESH_FAILED"
  | "INTERNAL_ERROR";

// ── Factory helpers ────────────────────────────────────────────────────────────

export function validationError(
  fieldErrors: Record<string, string[]>
): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error: "Validation failed. Please check the highlighted fields.",
      code: "VALIDATION_ERROR",
      fieldErrors,
    },
    { status: 422 }
  );
}

export function emailInUseError(): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error: "This email address is already registered. Please log in instead.",
      code: "EMAIL_ALREADY_IN_USE",
    },
    { status: 409 }
  );
}

export function invalidCredentialsError(): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error: "Invalid email or password.",
      code: "INVALID_CREDENTIALS",
    },
    { status: 401 }
  );
}

export function userNotFoundError(): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      // Generic message — do not reveal whether the email exists
      error: "Invalid email or password.",
      code: "USER_NOT_FOUND",
    },
    { status: 401 }
  );
}

export function accountLockedError(lockedUntil: Date): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error:
        "Your account has been locked due to too many failed attempts. Please try again later.",
      code: "ACCOUNT_LOCKED",
      lockedUntil: lockedUntil.toISOString(),
    },
    { status: 423 }
  );
}

export function unauthorizedError(): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error: "You must be signed in to access this resource.",
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

export function sessionExpiredError(): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error: "Your session has expired. Please sign in again.",
      code: "SESSION_EXPIRED",
    },
    { status: 401 }
  );
}

export function refreshFailedError(): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      error: "Could not refresh session. Please sign in again.",
      code: "REFRESH_FAILED",
    },
    { status: 401 }
  );
}

export function internalError(detail?: string): NextResponse<AuthErrorResponse> {
  // Log the detail server-side but never expose it to the client
  if (detail) console.error("[Auth] Internal error:", detail);
  return NextResponse.json(
    {
      error: "An unexpected error occurred. Please try again.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
