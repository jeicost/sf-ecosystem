import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Require authenticated user session.
 * Returns user if authenticated, throws Error (status 401) if not.
 * Use at the top of any API route that requires auth.
 *
 * Example:
 *   export async function POST(request) {
 *     const user = await requireAuthGate()
 *     // now proceed with logic, knowing user exists
 *   }
 */
export async function requireAuthGate() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: User session required')
  }

  return user
}
