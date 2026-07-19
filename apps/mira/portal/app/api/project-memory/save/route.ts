import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

export async function POST(req: NextRequest) {
  try {
    const { queue_id, category, tags, note } = await req.json()

    if (!queue_id || !category) {
      return NextResponse.json({ error: 'Missing queue_id or category' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: generation } = await admin.from('generation_queue').select('*').eq('id', queue_id).single()

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, generation.client_id))) {
      return NextResponse.json({ error: 'No access to this generation' }, { status: 403 })
    }

    const summary = typeof generation.result_data === 'string'
      ? generation.result_data.slice(0, 500)
      : JSON.stringify(generation.result_data).slice(0, 500)

    const { data: memory, error: saveError } = await admin
      .from('project_memory')
      .insert({
        client_id: generation.client_id,
        title: generation.tool_slug ? `${generation.tool_slug} output` : 'Generation',
        category: category,
        summary: summary,
        full_content: generation.result_data,
        tags: tags || [],
        source_department: 'toolkit'
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      memory_id: memory?.id,
      message: 'Saved to Project Memory'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
