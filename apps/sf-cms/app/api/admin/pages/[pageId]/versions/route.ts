import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireSession()

    const { pageId } = await params
    const supabase = createAdminClient()

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
}
