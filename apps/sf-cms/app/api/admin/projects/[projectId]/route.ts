import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

/**
 * GET /api/admin/projects/[projectId]
 * Used by the page editor to build the "Preview" link (EDUX-N4) — needs
 * preview_secret + preview_base_url, never returned by the list endpoint.
 */
export const GET = withAdminAuth(async (
  user,
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await params
  if (!(await canAccessProject(user, projectId))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  const client = createAdminClient()
  const { data: project, error } = await client
    .from('projects')
    .select('id, name, slug, preview_secret, preview_base_url, settings')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  return Response.json({ project }, { status: 200 })
})

/**
 * PATCH /api/admin/projects/[projectId]
 * Supports updating vercel_hook_url (Deploy Hook automation) and
 * preview_base_url (EDUX-N4 preview link).
 */
export const PATCH = withAdminAuth(async (
  user,
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  try {
    const { projectId } = await params
    // Was missing before this pass — an editor scoped to project A could
    // otherwise PATCH project B's deploy hook / preview URL. Same check
    // every other project-scoped write endpoint already does.
    if (!(await canAccessProject(user, projectId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const { vercel_hook_url, preview_base_url, settings } = body

    const updateData: Record<string, any> = {}
    if (vercel_hook_url !== undefined) updateData.vercel_hook_url = vercel_hook_url || null
    if (preview_base_url !== undefined) updateData.preview_base_url = preview_base_url || null

    const client = createAdminClient()

    // settings es un jsonb compartido (pixels site-wide + posible config
    // futura): merge server-side sobre lo existente, nunca replace — un
    // caller que solo envía pixels no debe borrar otras claves. Enviar un
    // valor null/"" en una clave la elimina (permite limpiar un pixel).
    if (settings !== undefined) {
      if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
        return Response.json({ error: 'settings must be an object' }, { status: 400 })
      }
      const { data: current, error: readError } = await client
        .from('projects')
        .select('settings')
        .eq('id', projectId)
        .single()
      if (readError) throw readError
      const merged: Record<string, any> = { ...(current?.settings || {}) }
      for (const [k, v] of Object.entries(settings)) {
        if (v === null || v === '') delete merged[k]
        else merged[k] = v
      }
      updateData.settings = merged
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: project, error } = await client
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select('id, name, slug, vercel_hook_url, preview_base_url, settings')
      .single()

    if (error) throw error

    return Response.json({ project }, { status: 200 })
  } catch (err) {
    console.error('Error updating project:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
