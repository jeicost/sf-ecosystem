import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

export const runtime = 'nodejs'

/**
 * GET /api/projects/[id]/deliverables
 * Lists generation_queue entries scoped to a project.
 * 404 if the project does not exist, 403 if the user has no grant for its client.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: project } = await admin
      .from('mira_projects')
      .select('id, client_id')
      .eq('id', id)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const allowed = await userCanAccessClient(user, project.client_id)
    if (!allowed) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const { data: deliverables, error } = await admin
      .from('generation_queue')
      .select('id, tool_slug, status, created_at, error_message')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deliverables: deliverables || [] }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 }
    )
  }
}
