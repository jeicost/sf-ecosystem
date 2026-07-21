import { createAdminClient } from '@/lib/supabase/admin'
import { captureError } from '@/lib/capture-error'
import { checkRateLimit } from '@/lib/rate-limit'

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

    // Verify API key belongs to project
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('id, slug')
      .eq('api_key', apiKey)
      .eq('slug', project_slug)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Invalid API key or project' }, { status: 401 })
    }

    // Fetch page
    if (slug) {
      const { data: page, error } = await client
        .from('pages')
        .select('*')
        .eq('project_id', project.id)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !page) {
        return Response.json({ error: 'Page not found' }, { status: 404 })
      }

      return Response.json(page, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
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

    return Response.json({ pages, total: count ?? pages?.length ?? 0, limit, offset }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    await captureError(err, { route: 'GET /api/public/pages' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
