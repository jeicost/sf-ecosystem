import { createAdminClient } from '@/lib/supabase/admin'
import { captureError } from '@/lib/capture-error'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyProjectApiKey } from '@/lib/auth/verify-api-key'
import { privateCache, noCache } from '@/lib/cache-headers'

// Without this, Next/Vercel can statically optimize this route (no dynamic
// APIs are called) and cache a response at the edge keyed by URL alone —
// observed serving a stale cached response to `preview=true` requests for
// ~60-100s despite the route computing `Cache-Control: private, no-store`
// for that branch (found piloting Draft Mode on adrian-grooves, 2026-07-30).
// force-dynamic makes every request execute fresh so the CDN respects
// whichever Cache-Control that specific response actually returns.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_slug = searchParams.get('project')
    const slug = searchParams.get('slug')
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return Response.json({ error: 'Missing x-api-key header' }, { status: 401 })
    }

    if (!checkRateLimit(apiKey)) {
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }

    const client = createAdminClient()

    // Verify API key belongs to project (legacy plaintext or hashed — MT-03/SEC-02)
    const project = project_slug ? await verifyProjectApiKey(project_slug, apiKey) : null

    if (!project) {
      return Response.json({ error: 'Invalid API key or project' }, { status: 401 })
    }

    // Draft/unpublished preview (EDUX-N4): requires a SECOND, distinct secret
    // beyond api_key — a leaked api_key alone must never expose unpublished
    // content. api_key gates "is this a legitimate site", preview_secret
    // gates "may this request also see drafts".
    const wantsPreview = searchParams.get('preview') === 'true'
    let allowDraft = false
    if (wantsPreview) {
      const previewSecret = request.headers.get('x-preview-secret')
      const { data: projectRow } = await client
        .from('projects')
        .select('preview_secret')
        .eq('id', project.id)
        .single()
      allowDraft = !!previewSecret && !!projectRow?.preview_secret && previewSecret === projectRow.preview_secret
      if (!allowDraft) {
        return Response.json({ error: 'Invalid or missing x-preview-secret' }, { status: 401 })
      }
    }

    // Fetch page
    if (slug) {
      let query = client
        .from('pages')
        .select('*')
        .eq('project_id', project.id)
        .eq('slug', slug)
      if (!allowDraft) {
        query = query.eq('status', 'published')
      }
      const { data: page, error } = await query.single()

      if (error || !page) {
        return Response.json({ error: 'Page not found' }, { status: 404 })
      }

      // La caché es PRIVADA, nunca compartida: la api-key va en cabecera y la
      // CDN indexa por URL, así que una respuesta pública se servía a quien no
      // presentó clave. Ver lib/cache-headers.ts.
      return Response.json(page, { headers: allowDraft ? noCache() : privateCache(60) })
    }

    // Fetch published pages, paginated (default generous enough that
    // existing client scripts expecting "all pages" see zero change today)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const { data: pages, error, count } = await client
      .from('pages')
      .select('*', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      await captureError(error, { route: 'GET /api/public/pages' })
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    return Response.json(
      { pages, total: count ?? pages?.length ?? 0, limit, offset },
      { headers: privateCache(60) }
    )
  } catch (err) {
    await captureError(err, { route: 'GET /api/public/pages' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
