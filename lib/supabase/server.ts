/**
 * lib/supabase/server.ts
 *
 * Server-side Supabase client for use in:
 *   - Server Components
 *   - Route Handlers (app/api/*)
 *   - Server Actions
 *
 * Uses @supabase/ssr to read/write cookies on the server so that
 * the Supabase Auth session stays in sync with Next.js cookies.
 *
 * TWO clients are exported:
 *   createServerClient  – uses the anon key, respects RLS, runs as the
 *                         logged-in user. Use this for all normal data access.
 *   createServiceClient – uses the service-role key, bypasses RLS.
 *                         Use ONLY for admin operations (e.g. creating a user
 *                         profile after signup). Never expose to the browser.
 */

import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

// Cookie type from @supabase/ssr — used to type the setAll callback parameter
type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

// ── Anon / user-scoped client ─────────────────────────────────────────────────

export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component where cookies are
            // read-only. The middleware (middleware.ts) handles the actual
            // cookie refresh so this error is safe to swallow here.
          }
        },
      },
    }
  );
}

// ── Service-role client (admin, bypasses RLS) ─────────────────────────────────

export async function createServiceClient() {
  const cookieStore = await cookies();

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Same as above — safe to swallow in Server Components.
          }
        },
      },
      auth: {
        // The service-role client must never auto-refresh or persist sessions.
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
