/**
 * lib/supabase/middleware.ts
 *
 * Session-refresh helper called from the root middleware.ts.
 *
 * What it does:
 *   1. Creates a Supabase client that can read AND write cookies on the
 *      NextResponse object (required by @supabase/ssr).
 *   2. Calls getUser() which transparently refreshes the access token if
 *      it has expired (using the refresh token stored in cookies).
 *   3. Returns both the user and the mutated response so the root
 *      middleware can attach the updated cookies to the outgoing response.
 *
 * Why this is separate from middleware.ts:
 *   Keeping the Supabase wiring here means middleware.ts stays clean and
 *   only deals with routing logic (redirects, role guards, etc.).
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

// Cookie type from @supabase/ssr — used to type the setAll callback parameter
type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function updateSession(request: NextRequest) {
  // Start with a plain pass-through response; we will mutate its cookies.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // 1. Write cookies onto the *request* so downstream server code
          //    can read the refreshed token in the same request cycle.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // 2. Re-create the response with the mutated request cookies,
          //    then write every cookie onto the *response* so the browser
          //    receives the updated tokens.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called here (not getSession()) because
  // getSession() reads the token from the cookie without re-validating it
  // with the Supabase Auth server. getUser() contacts the server and is
  // therefore reliable for auth checks in middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response: supabaseResponse };
}
