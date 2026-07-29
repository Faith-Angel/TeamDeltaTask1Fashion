/**
 * middleware.ts
 *
 * Supabase session refresh + role-based route guards for the NdoloStitch app.
 * Frontend routes (client/designer/vendor/marketer) are protected here.
 */

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const GUEST_ONLY_ROUTES = ["/login", "/register"];

const ROLE_DASHBOARDS: Record<string, string> = {
  Client: "/dashboard",
  Designer: "/designer/dashboard",
  Vendor: "/vendor/dashboard",
  Marketer: "/marketer/dashboard",
};

const ROLE_ROUTE_PREFIXES: Record<string, string[]> = {
  Client: [
    "/dashboard",
    "/feed",
    "/designers",
    "/marketplace",
    "/cart",
    "/checkout",
    "/training",
    "/chat",
    "/notifications",
  ],
  Designer: ["/designer"],
  Vendor: ["/vendor"],
  Marketer: ["/marketer"],
};

function isPublic(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/guest")
  );
}

function isGuestOnly(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getRoleFromUser(
  user: { app_metadata?: Record<string, unknown> } | null
): string | null {
  if (!user?.app_metadata) return null;
  return (user.app_metadata["role"] as string) ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, response } = await updateSession(request);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/site.webmanifest") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return response;
  }

  if (pathname.startsWith("/api")) {
    return response;
  }

  if (isPublic(pathname)) {
    return response;
  }

  if (isGuestOnly(pathname)) {
    if (user) {
      const role = getRoleFromUser(user);
      const dashboard = role
        ? (ROLE_DASHBOARDS[role] ?? "/dashboard")
        : "/dashboard";
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = getRoleFromUser(user);
  if (role) {
    for (const [otherRole, prefixes] of Object.entries(ROLE_ROUTE_PREFIXES)) {
      if (otherRole === role) continue;
      const isWrongRoleRoute = prefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );
      if (isWrongRoleRoute) {
        const ownDashboard = ROLE_DASHBOARDS[role] ?? "/dashboard";
        return NextResponse.redirect(new URL(ownDashboard, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
