import { createBrowserClient } from '@supabase/ssr'
import { createClient as _createClient } from '@supabase/supabase-js'

// Browser client — stores session in cookies so middleware can read it
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side only — bypasses RLS, never expose to browser
export function adminClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
