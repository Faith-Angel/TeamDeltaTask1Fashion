/**
 * components/providers.tsx
 *
 * Client-side provider tree.
 * Wrap every client-side context provider here so the root layout
 * (a Server Component) stays clean and import boundaries are respected.
 *
 * Current providers:
 *   - React Query (TanStack Query v5) — server-state caching
 *
 * Add more providers here as the project grows (e.g. Zustand hydration,
 * theme provider, toast notifications).
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// ── Providers ──────────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  // Create the QueryClient inside useState so each browser tab / server
  // render gets its own instance (prevents state leakage between requests).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 60 seconds — reduces redundant
            // network requests when the user navigates between pages quickly.
            staleTime: 60 * 1000,
            // Retry failed queries once before surfacing an error.
            retry: 1,
          },
          mutations: {
            // Do not retry mutations by default — they are not idempotent.
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only included in development builds */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
