import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server-component guard: redirects anyone who isn't super_admin to /home.
 * Used by the internal-agency pages that live inside client-facing route
 * trees (operations/billing, operations/system, operations/users). The old
 * version of this check sat on operations/layout.tsx and blocked the WHOLE
 * /operations tree -- which silently bounced real clients from the
 * department's My Team page to /home once the sidebar started showing it.
 */
export async function requireSuperAdminOrRedirect(): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.plan !== 'super_admin') {
    redirect('/home')
  }
}
