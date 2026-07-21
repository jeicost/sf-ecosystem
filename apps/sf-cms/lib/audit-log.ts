import { createAdminClient } from '@/lib/supabase/admin'

interface LogActivityParams {
  projectId?: string | null
  action: 'create' | 'update' | 'delete' | 'publish'
  resourceType: 'page' | 'post' | 'project'
  resourceId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  userId?: string | null
  userEmail?: string | null
}

/**
 * Writes to `audit_log` (found existing-but-unused in production 2026-07-19,
 * more general than the tracked-but-dead `page_activity` table). Fire-and-
 * forget: never throws — an audit trail must never block or fail the
 * actual create/update/delete it's recording.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const client = createAdminClient()
    await client.from('audit_log').insert({
      user_id: params.userId ?? null,
      project_id: params.projectId ?? null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      old_values: params.oldValues ?? null,
      // Email travels inside new_values so it survives user deletion and
      // needs no schema change (audit_log has no email column).
      new_values: params.userEmail
        ? { ...(params.newValues ?? {}), _actor: params.userEmail }
        : params.newValues ?? null,
    })
  } catch (err) {
    console.warn('[audit-log] write failed (non-fatal):', (err as Error).message)
  }
}
