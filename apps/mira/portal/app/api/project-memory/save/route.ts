import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

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

    const { data: memory, error: saveError } = await admin
      .from('project_memory')
      .insert({
        client_id: generation.client_id,
        tool_slug: generation.tool_slug,
        category: category,
        tags: tags || [],
        content: generation.result_data,
        notes: note
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
