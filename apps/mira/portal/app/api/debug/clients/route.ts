import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = adminClient()
    let query = db
      .from('clients')
      .select('id, name, slug, status, icp, created_at')
      .order('name')

    // Non super_admin: only list clients the user has a grant for
    if (user.user_metadata?.plan !== 'super_admin') {
      const { data: grants } = await db
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)

      const grantedIds = (grants || []).map((g) => g.project_id)
      if (!grantedIds.length) {
        return Response.json({ count: 0, data: [] })
      }
      query = query.in('id', grantedIds)
    }

    const { data, error } = await query

    if (error) {
      return Response.json({ error: error.message, details: error }, { status: 500 })
    }

    return Response.json({
      count: data?.length || 0,
      data,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
