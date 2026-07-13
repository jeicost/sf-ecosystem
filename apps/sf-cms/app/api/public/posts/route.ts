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

    // Fetch single post
    if (slug) {
      const { data: post, error } = await client
        .from('posts')
        .select('*')
        .eq('project_id', project.id)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !post) {
        return Response.json({ error: 'Post not found' }, { status: 404 })
      }

      return Response.json(post, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
        },
      })
    }

    // Fetch all published posts
    const { data: posts, error } = await client
      .from('posts')
      .select('*')
      .eq('project_id', project.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('DB error:', error)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    return Response.json({ posts }, {
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
