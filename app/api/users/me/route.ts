 /**
 * app/api/users/me/route.ts
 *
 * GET  /api/users/me  — return the authenticated user's full profile
 * PATCH /api/users/me — update mutable fields (fullName, location, pushToken)
 *
 * Both handlers require an active session. Role cannot be changed after
 * registration — that field is intentionally excluded from the update schema.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser, toPublicUser } from "@/lib/auth/helpers";
import { updateUserSchema } from "@/lib/validations/user";
import {
  unauthorizedError,
  validationError,
  internalError,
} from "@/lib/auth/errors";

// ── GET /api/users/me ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    // Fetch the full record (getAuthenticatedUser returns a trimmed shape)
    const user = await db.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) return unauthorizedError();

    return NextResponse.json({ user: toPublicUser(user) }, { status: 200 });
  } catch (err) {
    return internalError(String(err));
  }
}

// ── PATCH /api/users/me ────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedError();

    // Parse + validate body
    const body = await request.json().catch(() => ({}));
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const data = parsed.data;

    // Only include fields that were actually sent (avoid overwriting with undefined)
    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.pushToken !== undefined) updateData.pushToken = data.pushToken;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update." },
        { status: 200 }
      );
    }

    const updated = await db.user.update({
      where: { id: authUser.id },
      data: updateData,
    });

    return NextResponse.json(
      { user: toPublicUser(updated) },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
