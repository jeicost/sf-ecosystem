import { createClient as createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Returns the authenticated admin user, or false. Truthy/falsy compatible
 * with the old boolean form, but callers can now attribute actions:
 *   const user = await requireSession()
 *   if (!user) return 401
 *   logActivity({ ..., userId: user.id, userEmail: user.email })
 */
export async function requireSession(): Promise<User | false> {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // app_metadata is only writable server-side (service role) — unlike
    // user_metadata, which any authenticated user can edit on themselves.
    return user.app_metadata?.is_admin === true ? user : false
  } catch (err) {
    return false
  }
}

export async function requireSessionOrThrow() {
  if (!(await requireSession())) {
    throw new Error('Unauthorized: valid session required')
  }
}
