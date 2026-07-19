import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params

    const client = createAdminClient()
    const { data: post, error } = await client
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error) throw error

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    return Response.json({ post }, { status: 200 })
  } catch (err) {
    console.error('Error fetching post:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params
    const body = await request.json()
    const { title, slug, status, content_html, excerpt, category, author_name, seo_title, seo_description } = body

    const client = createAdminClient()

    // Fetch current post first
    const { data: currentPost, error: fetchErr } = await client
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (fetchErr) throw fetchErr

    if (!currentPost) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create version snapshot if content changed
    if (content_html && content_html !== currentPost.content_html) {
      const { error: revisionErr } = await client
        .from('posts_revisions')
        .insert({
          post_id: postId,
          content_html: currentPost.content_html,
          created_by: 'admin',
          created_at: new Date().toISOString(),
        })
        .single()

      if (revisionErr) throw revisionErr
    }

    // Update post
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (status !== undefined) updateData.status = status
    if (content_html !== undefined) updateData.content_html = content_html
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (category !== undefined) updateData.category = category
    if (author_name !== undefined) updateData.author_name = author_name
    if (seo_title !== undefined) updateData.seo_title = seo_title
    if (seo_description !== undefined) updateData.seo_description = seo_description
    updateData.updated_at = new Date().toISOString()

    const { data: post, error: updateErr } = await client
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateErr) throw updateErr

    return Response.json({ post }, { status: 200 })
  } catch (err) {
    console.error('Error updating post:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params
    const client = createAdminClient()

    const { error } = await client
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error

    return Response.json({ deleted: true }, { status: 200 })
  } catch (err) {
    console.error('Error deleting post:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
