import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Require authenticated user session.
 * Returns user if authenticated, throws Error if not.
 * Use at the top of any API route that requires auth.
 *
 * By default it ALSO requires the super_admin plan — every current caller is an
 * administrative/seed route (init-*, fix-*, populate-*, apply-migration,
 * ensure-tables, schema, load-*, list-clients, debug-*, test-*).
 * Pass requireSuperAdmin = false explicitly for routes open to any signed-in user.
 *
 * Example:
 *   export async function POST(request) {
 *     const user = await requireAuthGate()
 *     // now proceed with logic, knowing user exists and is super_admin
 *   }
 */
export async function requireAuthGate(requireSuperAdmin = true) {
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

  if (requireSuperAdmin && user.user_metadata?.plan !== 'super_admin') {
    throw new Error('Forbidden: super_admin required')
  }

  return user
}
