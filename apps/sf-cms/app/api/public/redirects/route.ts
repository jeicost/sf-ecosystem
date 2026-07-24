import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/capture-error'

/**
 * Public redirects endpoint: GET /api/public/redirects?project=<slug>
 * Header: x-api-key. Returns [{ from, to, code }] (slug-level) for the
 * consuming site to bake and apply in next.config.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('project') || searchParams.get('project_slug')
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) return Response.json({ error: 'Missing x-api-key header' }, { status: 401 })
    if (!checkRateLimit(apiKey)) return Response.json({ error: 'Too many requests' }, { status: 429 })
    if (!projectSlug) return Response.json({ error: 'Missing project query parameter' }, { status: 400 })

    const client = createAdminClient()
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('id')
      .eq('api_key', apiKey)
      .eq('slug', projectSlug)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Invalid API key or project' }, { status: 401 })
    }

    const { data: rows } = await client
      .from('redirects')
      .select('from_slug, to_slug, code')
      .eq('project_id', project.id)

    const redirects = (rows ?? []).map((r) => ({ from: r.from_slug, to: r.to_slug, code: r.code }))

    return Response.json(
      { redirects },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch (err) {
    await captureError(err, { route: 'GET /api/public/redirects' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
