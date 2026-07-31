import { createBrowserSupabaseClient, createServiceRoleClient } from '@sf/supabase'

// Browser client — stores session in cookies so middleware can read it
export function createClient() {
  return createBrowserSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Server-side only — bypasses RLS, never expose to browser
export function adminClient() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
