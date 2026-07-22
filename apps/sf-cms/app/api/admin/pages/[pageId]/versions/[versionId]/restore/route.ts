import { requireSession } from '@/lib/auth/require-session'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/audit-log'
import { captureError } from '@/lib/capture-error'
import type { NextRequest } from 'next/server'

/**
 * POST — server-side version restore (the old "Undo" only loaded a version
 * into client state and relied on a manual Save). Snapshots the CURRENT
 * sections first, so a restore is itself undoable, then writes the chosen
 * version's sections back to the page.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string; versionId: string }> }
) {
  try {
    const user = await requireSession()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId, versionId } = await params
    const client = createAdminClient()

    const { data: page, error: pageErr } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (pageErr || !page) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    if (!(await canAccessProject(user, page.project_id))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: version, error: versionErr } = await client
      .from('page_versions')
      .select('*')
      .eq('id', versionId)
      .eq('page_id', pageId)
      .single()

    if (versionErr || !version) {
      return Response.json({ error: 'Version not found' }, { status: 404 })
    }

    // Snapshot current state before overwriting — abort the restore if the
    // snapshot fails (never lose the only copy of the current content).
    const { count } = await client
      .from('page_versions')
      .select('id', { count: 'exact', head: true })
      .eq('page_id', pageId)

    const { error: snapErr } = await client
      .from('page_versions')
      .insert({
        page_id: pageId,
        version_number: (count ?? 0) + 1,
        sections_json: page.sections_json,
        created_by: user.email ?? user.id,
        created_at: new Date().toISOString(),
      })
      .single()

    if (snapErr) throw snapErr

    const { data: updated, error: updateErr } = await client
      .from('pages')
      .update({
        sections_json: version.sections_json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .select()
      .single()

    if (updateErr) throw updateErr

    await logActivity({
      userId: user.id,
      userEmail: user.email ?? null,
      projectId: page.project_id,
      action: 'update',
      resourceType: 'page',
      resourceId: pageId,
      oldValues: { restored_from_version: version.version_number ?? versionId },
      newValues: { title: page.title, slug: page.slug },
    })

    return Response.json({ page: updated }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'POST /api/admin/pages/[pageId]/versions/[versionId]/restore' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
