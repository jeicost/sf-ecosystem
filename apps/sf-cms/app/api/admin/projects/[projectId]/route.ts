import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

/**
 * PATCH /api/admin/projects/[projectId]
 * Currently only supports updating vercel_hook_url (Deploy Hook automation).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { vercel_hook_url } = body

    const updateData: Record<string, any> = {}
    if (vercel_hook_url !== undefined) updateData.vercel_hook_url = vercel_hook_url || null

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const client = createAdminClient()
    const { data: project, error } = await client
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select('id, name, slug, vercel_hook_url')
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
}
