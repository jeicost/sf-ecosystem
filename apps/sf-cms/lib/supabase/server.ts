import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'

/**
 * Supabase server-side client for SF-CMS
 * Uses SSR helpers to handle cookies properly
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerComponentClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookieStore
  )
}
