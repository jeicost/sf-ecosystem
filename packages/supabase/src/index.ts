// Shared Supabase Client & Types
export * from '@supabase/supabase-js';
export * from '@supabase/ssr';

// Factory functions for app-specific client creation
// Each app passes its own SUPABASE_URL and SUPABASE_KEY
export { createClient } from '@supabase/supabase-js';
export { createServerClient, createBrowserClient } from '@supabase/ssr';

import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only service-role client: bypasses RLS, never exposed to the browser.
 * Same auth config every app was hand-rolling separately (no session
 * persistence/refresh — this client is a one-off, request-scoped tool, not a
 * logged-in user session).
 */
export function createServiceRoleClient<Database = any>(
  url: string | undefined,
  serviceRoleKey: string | undefined
): SupabaseClient<Database> {
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
