import { adminClient } from '@/lib/supabase'
import { requireAuthGate } from '@/lib/auth-gate'

/**
 * Require authenticated user AND validated client access.
 * Throws 401 if not authenticated, 403 if user has no client access.
 * Returns { user, clientId } for use in route handlers.
 *
 * Example:
 *   const { user, clientId } = await requireClientAccess()
 *   // Now proceed with queries filtered by clientId
 */
export async function requireClientAccess() {
  // Session-only gate: this helper is for normal-user routes, not admin ones
  const user = await requireAuthGate(false)

  const admin = adminClient()
  const { data: accessData } = await admin
    .from('mira_project_access')
    .select('project_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!accessData?.length) {
    throw new Error('Forbidden: No client access')
  }

  return {
    user,
    clientId: accessData[0].project_id,
  }
}
