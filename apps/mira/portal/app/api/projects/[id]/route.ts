import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

/**
 * PATCH/DELETE /api/projects/[id] — mutación server-side, mismo motivo que
 * la creación en app/api/projects/route.ts: mira_projects tiene RLS activada
 * (migración 0037) pero solo con política de SELECT — un UPDATE/DELETE con
 * la anon key del navegador siempre afecta 0 filas (RLS los filtra en
 * silencio), lo que además rompía useProjectManagement's .select().single()
 * con un 406 tras el "archivar" un proyecto (parecía funcionar en la UI,
 * pero nunca se guardaba). Verifica acceso al client_id del proyecto antes
 * de mutar con el cliente admin (bypassa RLS).
 */
async function resolveProjectAccess(id: string) {
  const user = await getSessionUser()
  if (!user) return { ok: false as const, status: 401 as const, error: 'Unauthorized' }

  const admin = adminClient()
  const { data: project, error } = await admin
    .from('mira_projects')
    .select('client_id')
    .eq('id', id)
    .maybeSingle()
  if (error || !project) {
    return { ok: false as const, status: 404 as const, error: 'Project not found' }
  }

  const canAccess = await userCanAccessClient(user, project.client_id)
  if (!canAccess) {
    return { ok: false as const, status: 403 as const, error: 'No access to this project' }
  }

  return { ok: true as const, admin }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await resolveProjectAccess(id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await req.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string') updates.name = body.name
    if (typeof body.slug === 'string') updates.slug = body.slug
    if (typeof body.description === 'string' || body.description === null) updates.description = body.description
    if (typeof body.status === 'string') {
      if (!['active', 'archived'].includes(body.status)) {
        return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 })
      }
      updates.status = body.status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: project, error } = await access.admin
      .from('mira_projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !project) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({ project })
  } catch (error) {
    console.error('projects/[id] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await resolveProjectAccess(id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { error } = await access.admin.from('mira_projects').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('projects/[id] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
