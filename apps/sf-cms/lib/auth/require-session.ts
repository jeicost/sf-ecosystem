import { createClient as createServerClient } from '@/lib/supabase/server'

export async function requireSession() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // app_metadata is only writable server-side (service role) — unlike
    // user_metadata, which any authenticated user can edit on themselves.
    return user.app_metadata?.is_admin === true
  } catch (err) {
    return false
  }
}

export async function requireSessionOrThrow() {
  if (!(await requireSession())) {
    throw new Error('Unauthorized: valid session required')
  }
}
