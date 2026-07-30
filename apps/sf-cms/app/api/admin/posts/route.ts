import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/audit-log'
import { captureError } from '@/lib/capture-error'
import type { NextRequest } from 'next/server'

export const GET = withAdminAuth(async (user, request: NextRequest) => {
  try {
    const projectId = request.nextUrl.searchParams.get('project_id')

    if (!projectId) {
      return Response.json(
        { error: 'Missing project_id query parameter' },
        { status: 400 }
      )
    }

    if (!(await canAccessProject(user, projectId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = createAdminClient()
    const { data, error } = await client
      .from('posts')
      .select('id, title, slug, status, created_at, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Response.json({ posts: data || [] }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'GET /api/admin/posts' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json()
    const { project_id, title, slug } = body

    if (!project_id || !title || !slug) {
      return Response.json(
        { error: 'Missing required fields: project_id, title, slug' },
        { status: 400 }
      )
    }

    if (!(await canAccessProject(user, project_id))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = createAdminClient()

    // Check if slug already exists in this project
    const { data: existing } = await client
      .from('posts')
      .select('id')
      .eq('project_id', project_id)
      .eq('slug', slug)
      .single()

    if (existing) {
      return Response.json(
        { error: 'Post slug already exists in this project' },
        { status: 409 }
      )
    }

    // posts.client_slug is a NOT NULL column not present in the tracked
    // schema migrations (drift from earlier ad-hoc scripts, confirmed
    // 2026-07-21 — same class of bug as pages.client_slug/section_id found
    // 2026-07-19). Mirrors the parent project's.
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('client_slug')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create post
    const { data: post, error } = await client
      .from('posts')
      .insert({
        project_id,
        client_slug: project.client_slug,
        title,
        slug,
        status: 'draft',
        content_html: '<p>Start editing...</p>',
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      userId: user.id,
      userEmail: user.email ?? null,
      projectId: project_id,
      action: 'create',
      resourceType: 'post',
      resourceId: post.id,
      newValues: { title: post.title, slug: post.slug, status: post.status },
    })

    return Response.json(
      {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
      },
      { status: 201 }
    )
  } catch (err) {
    await captureError(err, { route: 'POST /api/admin/posts' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
