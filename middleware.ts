/**
 * middleware.ts  (project root)
 *
 * Next.js Edge Middleware — runs on every matched request BEFORE the page
 * or route handler is executed.
 *
 * Responsibilities:
 *   1. Refresh the Supabase Auth session (via updateSession helper).
 *   2. Redirect unauthenticated users away from protected routes.
 *   3. Redirect authenticated users away from auth pages (login/register).
 *   4. Enforce role-based access — wrong-role users are sent to their
 *      own dashboard instead of a forbidden error.
 *
 * Route classification:
 *   PUBLIC        – anyone can visit (no session required)
 *   AUTH_ONLY     – requires a valid session, redirects to /login if missing
 *   GUEST_ONLY    – login/register pages, redirect to dashboard if already
 *                   signed in
 *   ROLE_PREFIXED – /designer/*, /vendor/*, /marketer/* are locked to the
 *                   matching role; /dashboard redirects each role to theirs
 */

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── Route matchers ────────────────────────────────────────────────────────────

/** Routes that never require authentication */
const PUBLIC_ROUTES = [
  "/",
  "/browse",          // public marketplace browsing
  "/inspiration",     // public feed
  "/designers",       // public designer directory
];

/** Routes that are only for unauthenticated visitors */
const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

/** Role-specific dashboard prefixes */
const ROLE_DASHBOARDS: Record<string, string> = {
  Client:   "/dashboard/client",
  Designer: "/dashboard/designer",
  Vendor:   "/dashboard/vendor",
  Marketer: "/dashboard/marketer",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isGuestOnly(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** Extract the user's role from Supabase JWT app_metadata */
function getRoleFromUser(user: { app_metadata?: Record<string, unknown> } | null): string | null {
  if (!user?.app_metadata) return null;
  return (user.app_metadata["role"] as string) ?? null;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always refresh the session and propagate updated cookies.
  const { user, response } = await updateSession(request);

  // 2. Skip static assets and Next.js internals.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // 3. Guest-only pages — redirect signed-in users to their dashboard.
  if (isGuestOnly(pathname)) {
    if (user) {
      const role = getRoleFromUser(user);
      const dashboard = role
        ? ROLE_DASHBOARDS[role] ?? "/dashboard"
        : "/dashboard";
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return response;
  }

  // 4. Fully public pages — always allow.
  if (isPublic(pathname)) {
    return response;
  }

  // 5. API routes — let the route handler decide (it will call createServerClient
  //    and check the session itself). We still need to return the cookie-refreshed
  //    response so tokens stay valid.
  if (pathname.startsWith("/api")) {
    return response;
  }

  // 6. All other routes require authentication.
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Role-based route guards.
  const role = getRoleFromUser(user);

  if (role) {
    const roleLower = role.toLowerCase();

    // /dashboard  →  redirect to role-specific dashboard
    if (pathname === "/dashboard") {
      const dashboard = ROLE_DASHBOARDS[role] ?? "/dashboard/client";
      return NextResponse.redirect(new URL(dashboard, request.url));
    }

    // /dashboard/<other-role>/*  →  redirect to own dashboard
    const protectedPrefixes = [
      "/dashboard/client",
      "/dashboard/designer",
      "/dashboard/vendor",
      "/dashboard/marketer",
    ];
    const matchedPrefix = protectedPrefixes.find((p) =>
      pathname.startsWith(p)
    );
    if (matchedPrefix) {
      const expectedPrefix = `/dashboard/${roleLower}`;
      if (!pathname.startsWith(expectedPrefix)) {
        const ownDashboard = ROLE_DASHBOARDS[role] ?? "/dashboard";
        return NextResponse.redirect(new URL(ownDashboard, request.url));
      }
    }
  }

  return response;
}

// ── Matcher ───────────────────────────────────────────────────────────────────
// Run middleware on every route except static files and Next.js internals.

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
