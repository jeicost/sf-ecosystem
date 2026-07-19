import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Fires a project's Vercel Deploy Hook, if one is configured. Fire-and-forget,
 * non-blocking: NEVER throws and never delays the caller — a missing/broken
 * hook must never fail a page/post save. Call after a successful publish.
 */
export async function triggerDeployHook(projectId: string): Promise<void> {
  try {
    const client = createAdminClient()
    const { data: project } = await client
      .from('projects')
      .select('vercel_hook_url')
      .eq('id', projectId)
      .single()

    const hookUrl = project?.vercel_hook_url
    if (!hookUrl) return

    // Intentionally not awaited by the caller — this function itself awaits
    // the fetch so the process doesn't exit before the request is sent, but
    // callers should invoke it without `await` blocking their response.
    await fetch(hookUrl, { method: 'POST' }).catch((err) => {
      console.warn('[deploy-hook] fetch failed (non-fatal):', err.message)
    })
  } catch (err) {
    console.warn('[deploy-hook] lookup/trigger failed (non-fatal):', (err as Error).message)
  }
}
