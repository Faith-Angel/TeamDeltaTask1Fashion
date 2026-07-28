/**
 * app/api/auth/logout/route.ts
 *
 * POST /api/auth/logout
 *
 * Signs the current user out by:
 *   1. Calling supabase.auth.signOut() which invalidates the session
 *      on the Supabase Auth server and clears the session cookies.
 *   2. Returning a 200 so the client can clear local state.
 *
 * This endpoint works even if the session is already expired —
 * it will still clear cookies and return 200.
 *
 * Responses:
 *   200  { message: string }
 *   500  Internal error
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { internalError } from "@/lib/auth/errors";

export async function POST() {
  try {
    const supabase = await createServerClient();

    // signOut() clears the session cookie on the response via the
    // cookie handler wired up in createServerClient (lib/supabase/server.ts).
    // The "local" scope only signs out this device, not all sessions.
    await supabase.auth.signOut({ scope: "local" });

    return NextResponse.json(
      { message: "Signed out successfully." },
      { status: 200 }
    );
  } catch (err) {
    return internalError(String(err));
  }
}
