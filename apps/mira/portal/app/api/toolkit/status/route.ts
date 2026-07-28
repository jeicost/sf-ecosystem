import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const queue_id = searchParams.get('queue_id')

    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('generation_queue')
      .select('id, client_id, tool_slug, status, result_data, error_message, created_at, completed_at')
      .eq('id', queue_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 })
    }

    if (!(await userCanAccessClient(user, data.client_id))) {
      return NextResponse.json({ error: 'No access to this generation' }, { status: 403 })
    }

    return NextResponse.json({
      status: data.status,
      tool_slug: data.tool_slug,
      result_data: data.result_data,
      error_message: data.error_message,
      created_at: data.created_at,
      completed_at: data.completed_at,
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    )
  }
}
