import { createClient as createServerClient } from '@/lib/supabase/server'

export async function requireSession() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    return true
  } catch (err) {
    return false
  }
}

export async function requireSessionOrThrow() {
  if (!(await requireSession())) {
    throw new Error('Unauthorized: valid session required')
  }
}
