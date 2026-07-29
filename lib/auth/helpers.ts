/**
 * lib/auth/helpers.ts
 *
 * Server-side auth utilities used across API route handlers.
 *
 * Covers:
 *   - Getting the authenticated user from a request
 *   - Extracting the role from a Supabase session
 *   - Account lockout logic (5 failed attempts → 15 min lock)
 *   - Creating a User row in Prisma after first OTP verification
 *   - Building the public user object returned to the client
 */

import { createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Role, MarketerSubRole, type User } from "@prisma/client";

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PublicUser {
  id: string;
  authId: string;
  fullName: string;
  email: string;
  location: string;
  role: Role;
  marketerSubRole: MarketerSubRole | null;
  createdAt: Date;
}

export interface AuthenticatedRequest {
  user: PublicUser;
  authId: string;
}

// ── Get authenticated user ─────────────────────────────────────────────────────

/**
 * Reads the Supabase session from cookies and returns the corresponding
 * Prisma User record. Returns null if no valid session exists.
 */
export async function getAuthenticatedUser(): Promise<PublicUser | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      select: {
        id: true,
        authId: true,
        fullName: true,
        email: true,
        location: true,
        role: true,
        marketerSubRole: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * Same as getAuthenticatedUser but throws an error response if not
 * authenticated. Use in protected route handlers.
 */
export async function requireAuth(): Promise<PublicUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Require auth AND a specific role. Throws if wrong role.
 */
export async function requireRole(allowedRoles: Role[]): Promise<PublicUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ── User creation after OTP verification ──────────────────────────────────────

export interface CreateUserParams {
  authId: string;
  fullName: string;
  email: string;
  location: string;
  role: Role;
  marketerSubRole?: MarketerSubRole;
}

/**
 * Creates the Prisma User record and the corresponding role-specific
 * profile record in a single transaction.
 */
export async function createUserWithProfile(
  params: CreateUserParams
): Promise<User> {
  const { authId, fullName, email, location, role, marketerSubRole } = params;

  return db.$transaction(async (tx) => {
    // Create base User record
    const user = await tx.user.create({
      data: {
        authId,
        fullName,
        email,
        location,
        role,
        marketerSubRole: marketerSubRole ?? null,
      },
    });

    // Create role-specific profile
    switch (role) {
      case Role.Designer:
        await tx.designerProfile.create({
          data: { userId: user.id },
        });
        break;

      case Role.Vendor:
        await tx.vendorProfile.create({
          data: {
            userId: user.id,
            storeName: fullName, // default store name = user's name
          },
        });
        break;

      case Role.Marketer:
        await tx.marketerProfile.create({
          data: {
            userId: user.id,
            subRole: marketerSubRole!,
          },
        });
        break;

      case Role.Client:
        // Clients have no separate profile table — the User row is sufficient
        break;
    }

    return user;
  });
}

// ── Account lockout ────────────────────────────────────────────────────────────

/**
 * Checks if a user's account is currently locked.
 * Returns the lockedUntil date if locked, null if not locked.
 */
export async function checkAccountLock(
  userId: string
): Promise<Date | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user?.lockedUntil) return null;

  if (user.lockedUntil > new Date()) {
    return user.lockedUntil;
  }

  // Lock has expired — clear it
  await db.user.update({
    where: { id: userId },
    data: { lockedUntil: null, failedLoginAttempts: 0 },
  });

  return null;
}

/**
 * Records a failed OTP attempt. Locks the account after MAX_FAILED_ATTEMPTS.
 * Returns the lockedUntil date if the account was just locked, null otherwise.
 */
export async function recordFailedAttempt(
  userId: string
): Promise<Date | null> {
  const user = await db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
    select: { failedLoginAttempts: true },
  });

  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    await db.user.update({
      where: { id: userId },
      data: { lockedUntil },
    });
    return lockedUntil;
  }

  return null;
}

/**
 * Resets failed login attempts on successful authentication.
 */
export async function resetFailedAttempts(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

// ── Public user serialiser ─────────────────────────────────────────────────────

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    authId: user.authId,
    fullName: user.fullName,
    email: user.email,
    location: user.location,
    role: user.role,
    marketerSubRole: user.marketerSubRole,
    createdAt: user.createdAt,
  };
}

// ── Route handler error guard ──────────────────────────────────────────────────

/**
 * Checks if an unknown error thrown by requireAuth / requireRole
 * is an auth-specific error that should return 401/403.
 */
export function isAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
  );
}
