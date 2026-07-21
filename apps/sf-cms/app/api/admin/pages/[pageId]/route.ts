import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerDeployHook } from '@/lib/deploy-hook'
import { logActivity } from '@/lib/audit-log'
import { captureError } from '@/lib/capture-error'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params

    const client = createAdminClient()
    const { data: page, error } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (error) throw error

    if (!page) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    return Response.json({ page }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'GET /api/admin/pages/[pageId]' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const body = await request.json()
    const { title, slug, status, sections_json, seo_title, seo_description, og_image_url, canonical_url } = body

    const client = createAdminClient()

    // Fetch current page first (for page_versions snapshot)
    const { data: currentPage, error: fetchErr } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (fetchErr) throw fetchErr

    if (!currentPage) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create version snapshot if sections changed
    if (sections_json && JSON.stringify(sections_json) !== JSON.stringify(currentPage.sections_json)) {
      const { count } = await client
        .from('page_versions')
        .select('id', { count: 'exact', head: true })
        .eq('page_id', pageId)

      const { error: versionErr } = await client
        .from('page_versions')
        .insert({
          page_id: pageId,
          version_number: (count ?? 0) + 1,
          sections_json: currentPage.sections_json,
          created_by: 'admin',
          created_at: new Date().toISOString(),
        })
        .single()

      if (versionErr) throw versionErr
    }

    // Update page
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (status !== undefined) updateData.status = status
    if (sections_json !== undefined) updateData.sections_json = sections_json
    if (seo_title !== undefined) updateData.seo_title = seo_title
    if (seo_description !== undefined) updateData.seo_description = seo_description
    if (og_image_url !== undefined) updateData.og_image_url = og_image_url
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url
    updateData.updated_at = new Date().toISOString()

    const { data: page, error: updateErr } = await client
      .from('pages')
      .update(updateData)
      .eq('id', pageId)
      .select()
      .single()

    if (updateErr) throw updateErr

    await logActivity({
      projectId: page.project_id,
      action: status === 'published' && currentPage.status !== 'published' ? 'publish' : 'update',
      resourceType: 'page',
      resourceId: page.id,
      oldValues: { title: currentPage.title, slug: currentPage.slug, status: currentPage.status },
      newValues: { title: page.title, slug: page.slug, status: page.status },
    })

    // Non-blocking: never fails or delays the save if the hook is broken/unset
    if (page.status === 'published') {
      await triggerDeployHook(page.project_id)
    }

    return Response.json({ page }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'PATCH /api/admin/pages/[pageId]' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const client = createAdminClient()

    const { data: existing } = await client
      .from('pages')
      .select('project_id, title, slug, status')
      .eq('id', pageId)
      .single()

    const { error } = await client
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) throw error

    if (existing) {
      await logActivity({
        projectId: existing.project_id,
        action: 'delete',
        resourceType: 'page',
        resourceId: pageId,
        oldValues: { title: existing.title, slug: existing.slug, status: existing.status },
      })
    }

    return Response.json({ deleted: true }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'DELETE /api/admin/pages/[pageId]' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
