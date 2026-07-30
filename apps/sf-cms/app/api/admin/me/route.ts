import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { resolveAccess } from '@/lib/auth/access'

/** Who am I + what can I touch. Used by the admin UI to show/hide controls. */
export const GET = withAdminAuth(async (user) => {
  const access = await resolveAccess(user)
  return Response.json({
    email: user.email,
    isGlobalAdmin: access.isGlobalAdmin,
    projectIds: access.projectIds,
  })
})
