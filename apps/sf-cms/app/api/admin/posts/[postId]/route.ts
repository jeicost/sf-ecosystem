import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerDeployHook } from '@/lib/deploy-hook'
import { logActivity } from '@/lib/audit-log'
import { captureError } from '@/lib/capture-error'
import type { NextRequest } from 'next/server'

export async function GET(
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
    await captureError(err, { route: 'GET /api/admin/posts/[postId]' })
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
    const user = await requireSession()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params
    const body = await request.json()
    const { title, slug, status, content_html, excerpt, category, author_name, seo_title, seo_description, canonical_url } = body

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
          created_by: user.email ?? user.id,
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
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url
    updateData.updated_at = new Date().toISOString()

    const { data: post, error: updateErr } = await client
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateErr) throw updateErr

    await logActivity({
      userId: user.id,
      userEmail: user.email ?? null,
      projectId: post.project_id,
      action: status === 'published' && currentPost.status !== 'published' ? 'publish' : 'update',
      resourceType: 'post',
      resourceId: post.id,
      oldValues: { title: currentPost.title, slug: currentPost.slug, status: currentPost.status },
      newValues: { title: post.title, slug: post.slug, status: post.status },
    })

    // Non-blocking: never fails or delays the save if the hook is broken/unset
    if (post.status === 'published') {
      await triggerDeployHook(post.project_id)
    }

    return Response.json({ post }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'PATCH /api/admin/posts/[postId]' })
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
    const user = await requireSession()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params
    const client = createAdminClient()

    const { data: existing } = await client
      .from('posts')
      .select('project_id, title, slug, status')
      .eq('id', postId)
      .single()

    const { error } = await client
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error

    if (existing) {
      await logActivity({
        userId: user.id,
        userEmail: user.email ?? null,
        projectId: existing.project_id,
        action: 'delete',
        resourceType: 'post',
        resourceId: postId,
        oldValues: { title: existing.title, slug: existing.slug, status: existing.status },
      })
    }

    return Response.json({ deleted: true }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'DELETE /api/admin/posts/[postId]' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
