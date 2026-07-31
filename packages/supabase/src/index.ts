// Shared Supabase Client & Types
export * from '@supabase/supabase-js';
export * from '@supabase/ssr';

// Factory functions for app-specific client creation
// Each app passes its own SUPABASE_URL and SUPABASE_KEY
export { createClient } from '@supabase/supabase-js';
export { createServerClient, createBrowserClient } from '@supabase/ssr';

import { createClient as _createClient } from '@supabase/supabase-js';
import { createServerClient as _createServerClient, createBrowserClient as _createBrowserClient } from '@supabase/ssr';

/**
 * Server-only service-role client: bypasses RLS, never exposed to the browser.
 * Same auth config every app was hand-rolling separately (no session
 * persistence/refresh — this client is a one-off, request-scoped tool, not a
 * logged-in user session).
 */
export function createServiceRoleClient<Database = any>(
  url: string | undefined,
  serviceRoleKey: string | undefined
) {
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase URL/service role key for createServiceRoleClient()');
  }
  return _createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Plain anon-key browser client — thin wrapper for consistency across apps. */
export function createBrowserSupabaseClient<Database = any>(
  url: string | undefined,
  anonKey: string | undefined
) {
  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL/anon key for createBrowserSupabaseClient()');
  }
  return _createBrowserClient<Database>(url, anonKey);
}

interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  /** Omit for read-only contexts (e.g. middleware auth checks) — setAll becomes a no-op. */
  set?(name: string, value: string, options?: Record<string, unknown>): void;
}

/**
 * Server Component / Route Handler / Middleware client with the standard
 * Next.js App Router cookie adapter — the getAll/setAll wiring every app was
 * reimplementing identically. Pass the resolved cookie store (e.g. from
 * `await cookies()` in `next/headers`, or `request.cookies` in middleware —
 * both expose a compatible `getAll()`) rather than importing it here, so
 * this package stays decoupled from any one Next.js version's cookies API.
 */
export function createServerComponentClient<Database = any>(
  url: string | undefined,
  anonKey: string | undefined,
  cookieStore: CookieAdapter
) {
  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL/anon key for createServerComponentClient()');
  }
  return _createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        if (!cookieStore.set) return; // read-only context (e.g. middleware auth check)
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set!(name, value, options));
        } catch {
          // Ignore errors when setting cookies from a Server Component (no response to write to).
        }
      },
    },
  });
}
