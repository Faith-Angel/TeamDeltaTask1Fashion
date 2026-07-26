import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected route prefixes by role
const PROTECTED_ROUTES = {
  client: ['/dashboard', '/feed', '/designers', '/marketplace', '/cart', '/checkout', '/training', '/chat'],
  designer: ['/designer'],
  vendor: ['/vendor'],
  marketer: ['/marketer'],
};

const AUTH_ROUTES = ['/login', '/register'];
const GUEST_ROUTES = ['/guest'];
const PUBLIC_ROUTES = ['/', '/offline', '/api', '/_next', '/icons', '/manifest.json'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static assets
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Read auth cookie — set by the backend as httpOnly
  const authCookie = request.cookies.get('auth_token') || request.cookies.get('accessToken');
  const userRole = request.cookies.get('user_role')?.value;
  const isGuest = request.cookies.get('is_guest')?.value === 'true';

  const isAuthenticated = !!authCookie;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const roleRoutes: Record<string, string> = {
      Client: '/dashboard',
      Designer: '/designer/dashboard',
      Vendor: '/vendor/dashboard',
      Marketer: '/marketer/dashboard',
    };
    return NextResponse.redirect(new URL(roleRoutes[userRole || ''] || '/dashboard', request.url));
  }

  // Allow guest routes for guests
  if (isGuest && GUEST_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login for protected routes
  const isProtected = Object.values(PROTECTED_ROUTES)
    .flat()
    .some((r) => pathname.startsWith(r));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};
