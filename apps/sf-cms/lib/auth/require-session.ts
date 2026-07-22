import { createClient as createServerClient } from '@/lib/supabase/server'
import { canEnterAdmin } from '@/lib/auth/access'
import type { User } from '@supabase/supabase-js'

/**
 * Returns the authenticated user allowed into the admin (a global admin OR
 * an editor with at least one project role), or false. Truthy/falsy
 * compatible with the old boolean form; callers can attribute actions and,
 * for anything project-scoped, MUST additionally check canAccessProject —
 * an editor passing this gate is NOT allowed on every project.
 */
export async function requireSession(): Promise<User | false> {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    return (await canEnterAdmin(user)) ? user : false
  } catch (err) {
    return false
  }
}

export async function requireSessionOrThrow() {
  if (!(await requireSession())) {
    throw new Error('Unauthorized: valid session required')
  }
}
