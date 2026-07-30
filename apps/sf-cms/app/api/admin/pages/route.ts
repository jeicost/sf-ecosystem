import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/audit-log'
import { captureError } from '@/lib/capture-error'
import crypto from 'crypto'
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
      .from('pages')
      .select('id, title, slug, status, created_at, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Response.json({ pages: data || [] }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'GET /api/admin/pages' })
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
      .from('pages')
      .select('id')
      .eq('project_id', project_id)
      .eq('slug', slug)
      .single()

    if (existing) {
      return Response.json(
        { error: 'Page slug already exists in this project' },
        { status: 409 }
      )
    }

    // pages.client_slug and pages.section_id are NOT NULL columns not present
    // in the tracked schema migrations (drift from earlier ad-hoc scripts,
    // confirmed 2026-07-19) — this insert 500'd without them. client_slug
    // mirrors the parent project's; section_id has no FK, just needs a
    // unique-ish value (matches the convention seen on existing rows).
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('client_slug')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create page with empty sections
    const { data: page, error } = await client
      .from('pages')
      .insert({
        project_id,
        client_slug: project.client_slug,
        section_id: `page-${slug}-${crypto.randomBytes(4).toString('hex')}`,
        title,
        slug,
        status: 'draft',
        sections_json: [],
      })
      .select()
      .single()

    if (error) throw error

    await logActivity({
      userId: user.id,
      userEmail: user.email ?? null,
      projectId: project_id,
      action: 'create',
      resourceType: 'page',
      resourceId: page.id,
      newValues: { title: page.title, slug: page.slug, status: page.status },
    })

    return Response.json(
      {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
      },
      { status: 201 }
    )
  } catch (err) {
    await captureError(err, { route: 'POST /api/admin/pages' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
