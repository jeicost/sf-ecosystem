import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for SF-CMS admin UI
 * Uses anon key (session auth via cookies) for browser-side access
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
