import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withAdminAuth(async (
  user,
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) => {
  try {
    const { pageId } = await params
    const supabase = createAdminClient()

    const { data: parentPage } = await supabase
      .from('pages')
      .select('project_id')
      .eq('id', pageId)
      .single()
    if (!parentPage || !(await canAccessProject(user, parentPage.project_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: versions, error } = await supabase
      .from('page_versions')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ versions: versions || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch versions'
    console.error('Error fetching versions:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
})
