import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const project_slug = searchParams.get('project')
    const slug = searchParams.get('slug')
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return Response.json({ error: 'Missing x-api-key header' }, { status: 401 })
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

    // Fetch all pages for project
    const { data: pages, error } = await client
      .from('pages')
      .select('*')
      .eq('project_id', project.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('DB error:', error)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    return Response.json({ pages }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.error('Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
