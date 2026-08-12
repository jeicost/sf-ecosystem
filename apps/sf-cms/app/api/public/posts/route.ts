import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/capture-error'
import { verifyProjectApiKey } from '@/lib/auth/verify-api-key'
import { privateCache } from '@/lib/cache-headers'

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
          ...privateCache(60),
        },
      })
    }

    // Fetch published posts, paginated (default generous enough that
    // existing client scripts expecting "all posts" see zero change today)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const { data: posts, error, count } = await client
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('project_id', project.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      await captureError(error, { route: 'GET /api/public/posts' })
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    return Response.json({ posts, total: count ?? posts?.length ?? 0, limit, offset }, {
      headers: {
        ...privateCache(60),
      },
    })
  } catch (err) {
    await captureError(err, { route: 'GET /api/public/posts' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
