import { requireSession } from '@/lib/auth/require-session'
import { resolveAccess } from '@/lib/auth/access'

/** Who am I + what can I touch. Used by the admin UI to show/hide controls. */
export async function GET() {
  const user = await requireSession()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await resolveAccess(user)
  return Response.json({
    email: user.email,
    isGlobalAdmin: access.isGlobalAdmin,
    projectIds: access.projectIds,
  })
}
