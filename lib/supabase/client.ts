/**
 * lib/supabase/client.ts
 *
 * Browser-side Supabase client for use in:
 *   - Client Components ("use client")
 *   - Browser-only event handlers
 *
 * Uses @supabase/ssr's createBrowserClient so that the session cookie
 * is shared with the server-side client and stays in sync.
 *
 * The client is memoised — calling createBrowserClient() multiple times
 * in the same browser session returns the same instance.
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// ── Singleton ──────────────────────────────────────────────────────────────────

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClientSideClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
