import { requireSession } from '@/lib/auth/require-session'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { captureError } from '@/lib/capture-error'
import type { NextRequest } from 'next/server'

/**
 * POST /api/admin/posts/[postId]/duplicate
 * Copies a post into a new draft with a "-copy" slug.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireSession()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params
    const client = createAdminClient()

    const { data: source, error: fetchErr } = await client
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (fetchErr || !source) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!(await canAccessProject(user, source.project_id))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    let newSlug = `${source.slug}-copy`
    for (let i = 2; i <= 20; i++) {
      const { data: taken } = await client
        .from('posts')
        .select('id')
        .eq('project_id', source.project_id)
        .eq('slug', newSlug)
        .maybeSingle()
      if (!taken) break
      newSlug = `${source.slug}-copy-${i}`
    }

    // posts.client_slug is a NOT NULL column not in the tracked migrations
    // (same drift as posts/route.ts's POST handler, confirmed 2026-07-21) —
    // reused directly from source since we're duplicating within one project.
    const { data: copy, error: insertErr } = await client
      .from('posts')
      .insert({
        project_id: source.project_id,
        client_slug: source.client_slug,
        slug: newSlug,
        title: `${source.title} (copy)`,
        excerpt: source.excerpt,
        content_html: source.content_html,
        category: source.category,
        author_name: source.author_name,
        seo_title: source.seo_title,
        seo_description: source.seo_description,
        status: 'draft',
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    return Response.json({ post: copy }, { status: 201 })
  } catch (err) {
    await captureError(err, { route: 'POST /api/admin/posts/[postId]/duplicate' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
