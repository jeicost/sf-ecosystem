import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Fires a project's Vercel Deploy Hook, if one is configured, and records the
 * outcome in deploy_events (OPS-07) so a publish that never reached the site
 * is visible instead of silently lost. Fire-and-forget, non-blocking: NEVER
 * throws and never delays the caller. Call after a successful publish.
 */
export async function triggerDeployHook(projectId: string): Promise<void> {
  const client = createAdminClient()
  const record = (status: string, detail?: string) =>
    client
      .from('deploy_events')
      .insert({ project_id: projectId, status, detail: detail ?? null })
      .then(() => {}, () => {})

  try {
    const { data: project } = await client
      .from('projects')
      .select('vercel_hook_url')
      .eq('id', projectId)
      .single()

    const hookUrl = project?.vercel_hook_url
    if (!hookUrl) {
      await record('skipped', 'no deploy hook configured')
      return
    }

    try {
      const res = await fetch(hookUrl, { method: 'POST' })
      await record(res.ok ? 'ok' : 'failed', res.ok ? undefined : `hook returned ${res.status}`)
    } catch (err) {
      await record('failed', (err as Error).message)
    }
  } catch (err) {
    console.warn('[deploy-hook] lookup/trigger failed (non-fatal):', (err as Error).message)
    await record('failed', (err as Error).message)
  }
}
