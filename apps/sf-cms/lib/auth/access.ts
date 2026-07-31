import type { User } from '@sf/supabase'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Access {
  isGlobalAdmin: boolean
  /** Project IDs an editor is scoped to. Empty for a pure global admin (who accesses all). */
  projectIds: string[]
}

function isGlobalAdmin(user: User): boolean {
  // app_metadata is only writable server-side (service role), unlike
  // user_metadata which the user can edit on themselves.
  return user.app_metadata?.is_admin === true
}

/**
 * Resolve what a user can touch. Global admins access every project;
 * editors are limited to their user_project_roles rows.
 */
export async function resolveAccess(user: User): Promise<Access> {
  if (isGlobalAdmin(user)) {
    return { isGlobalAdmin: true, projectIds: [] }
  }
  const client = createAdminClient()
  const { data } = await client
    .from('user_project_roles')
    .select('project_id')
    .eq('user_id', user.id)
  return { isGlobalAdmin: false, projectIds: (data ?? []).map((r) => r.project_id) }
}

/** True if the user may enter the admin at all (global admin OR any editor role). */
export async function canEnterAdmin(user: User): Promise<boolean> {
  const access = await resolveAccess(user)
  return access.isGlobalAdmin || access.projectIds.length > 0
}

/** True if the user may act on a specific project. */
export async function canAccessProject(user: User, projectId: string): Promise<boolean> {
  if (isGlobalAdmin(user)) return true
  if (!projectId) return false
  const client = createAdminClient()
  const { data } = await client
    .from('user_project_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .maybeSingle()
  return !!data
}
