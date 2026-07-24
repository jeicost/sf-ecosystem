import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'

// Super Admin: real clients + who has access to each + their plan.
// Replaces the old /admin/users page, which queried mira_users (0 rows
// since auth was unified onto auth.users in migration 0016 — see
// docs/DEBT.md). The real access model is clients + mira_project_access +
// auth.users.user_metadata.plan.
export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser || sessionUser.user_metadata?.plan !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = adminClient()

    const [clientsRes, grantsRes] = await Promise.all([
      admin.from('clients').select('id, name').order('name'),
      admin.from('mira_project_access').select('user_id, project_id, role'),
    ])

    if (clientsRes.error) throw clientsRes.error
    if (grantsRes.error) throw grantsRes.error

    // GoTrue Admin API intermittently fails with "unrecognized JWT kid" —
    // see memory: supabase-service-role-gotrue-quirk. Retry before failing.
    let listUsersResult: Awaited<ReturnType<typeof admin.auth.admin.listUsers>> | null = null
    let listUsersErrorMessage: string | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (!res.error) {
        listUsersResult = res
        break
      }
      listUsersErrorMessage = res.error.message
      await new Promise((r) => setTimeout(r, 800))
    }
    if (!listUsersResult) {
      throw new Error(`Failed to list users after retries: ${listUsersErrorMessage}`)
    }

    const usersById = new Map(
      listUsersResult.data.users.map((u) => [
        u.id,
        { email: u.email ?? '(sin email)', plan: (u.user_metadata?.plan as string) ?? 'starter' },
      ])
    )

    const clients = (clientsRes.data || []).map((c) => {
      const users = (grantsRes.data || [])
        .filter((g) => g.project_id === c.id)
        .map((g) => {
          const u = usersById.get(g.user_id)
          return {
            userId: g.user_id,
            email: u?.email ?? '(usuario no encontrado)',
            role: g.role,
            plan: u?.plan ?? 'starter',
          }
        })
      return { id: c.id, name: c.name, users }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('admin/clients-users error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load clients/users' },
      { status: 500 }
    )
  }
}
