import { createAdminClient } from '@/lib/supabase/admin'
import { triggerDeployHook } from '@/lib/deploy-hook'
import { captureError } from '@/lib/capture-error'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

/**
 * Scheduled-publish + version-retention cron (OPS-05). Vercel Cron hits this
 * on a schedule (see vercel.json). Flips posts that are status='scheduled'
 * with published_at <= now to 'published' and fires their deploy hook, then
 * trims version history. Secured by CRON_SECRET (Vercel sends it as a Bearer
 * token when the env var is set).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = createAdminClient()
    const nowIso = new Date().toISOString()

    // 1. Scheduled posts that are due → publish
    const { data: due } = await client
      .from('posts')
      .select('id, project_id')
      .eq('status', 'scheduled')
      .lte('published_at', nowIso)

    const published: string[] = []
    const projects = new Set<string>()
    for (const post of due ?? []) {
      const { error } = await client.from('posts').update({ status: 'published' }).eq('id', post.id)
      if (!error) {
        published.push(post.id)
        projects.add(post.project_id)
      }
    }
    // one deploy hook per affected project
    for (const projectId of projects) {
      await triggerDeployHook(projectId)
    }

    // 2. Version retention (keep newest 50 per page/post)
    await client.rpc('trim_version_history', { keep: 50 }).then(
      () => {},
      (e: unknown) => console.warn('[cron] retention failed:', (e as Error).message),
    )

    return Response.json({ ok: true, published: published.length, projects: projects.size, ranAt: nowIso })
  } catch (err) {
    await captureError(err, { route: 'GET /api/cron/publish' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
