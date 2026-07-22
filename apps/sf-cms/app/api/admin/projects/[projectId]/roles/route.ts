import { requireSession } from '@/lib/auth/require-session'
import { resolveAccess } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { captureError } from '@/lib/capture-error'
import type { NextRequest } from 'next/server'

// Manage editors for a project. Global-admin only — an editor cannot grant
// access to others. GET lists editors, POST adds one by email, DELETE removes.

async function requireGlobalAdmin() {
  const user = await requireSession()
  if (!user) return { error: 'Unauthorized' as const, status: 401 }
  const access = await resolveAccess(user)
  if (!access.isGlobalAdmin) return { error: 'Forbidden' as const, status: 403 }
  return { user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const gate = await requireGlobalAdmin()
    if ('error' in gate) return Response.json({ error: gate.error }, { status: gate.status })

    const { projectId } = await params
    const client = createAdminClient()

    const { data: roles } = await client
      .from('user_project_roles')
      .select('id, user_id, role, created_at')
      .eq('project_id', projectId)

    // Resolve emails for display via the auth admin API.
    const { data: usersList } = await client.auth.admin.listUsers()
    const emailById = new Map((usersList?.users ?? []).map((u) => [u.id, u.email]))

    const editors = (roles ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      email: emailById.get(r.user_id) ?? '(unknown user)',
      role: r.role,
      created_at: r.created_at,
    }))

    return Response.json({ editors }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'GET /api/admin/projects/[projectId]/roles' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const gate = await requireGlobalAdmin()
    if ('error' in gate) return Response.json({ error: gate.error }, { status: gate.status })

    const { projectId } = await params
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = createAdminClient()

    // Find the user by email (they must already have a Supabase account —
    // create the user first, or invite them, before granting a role).
    const { data: usersList } = await client.auth.admin.listUsers()
    const target = (usersList?.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    )
    if (!target) {
      return Response.json(
        { error: `No user with email ${email}. Create the account first, then grant access.` },
        { status: 404 },
      )
    }

    const { error } = await client
      .from('user_project_roles')
      .upsert(
        { user_id: target.id, project_id: projectId, role: 'editor' },
        { onConflict: 'user_id,project_id' },
      )
    if (error) throw error

    return Response.json({ ok: true, email: target.email }, { status: 201 })
  } catch (err) {
    await captureError(err, { route: 'POST /api/admin/projects/[projectId]/roles' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const gate = await requireGlobalAdmin()
    if ('error' in gate) return Response.json({ error: gate.error }, { status: gate.status })

    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    if (!userId) return Response.json({ error: 'user_id is required' }, { status: 400 })

    const client = createAdminClient()
    const { error } = await client
      .from('user_project_roles')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
    if (error) throw error

    return Response.json({ ok: true }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'DELETE /api/admin/projects/[projectId]/roles' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
