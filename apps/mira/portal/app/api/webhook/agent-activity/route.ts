import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) return unauthorized()

  const body = await req.json()
  const {
    client_id,
    agent_name,
    agent_role,
    task_type,
    status,
    post_id,
    details,
  } = body

  if (!client_id || !agent_name || !agent_role || !task_type || !status) {
    return NextResponse.json(
      { error: 'client_id, agent_name, agent_role, task_type, and status are required' },
      { status: 400 }
    )
  }

  const db = adminClient()
  const { data, error } = await db
    .from('agent_activity')
    .insert({
      client_id,
      agent_name,
      agent_role,
      task_type,
      status,
      post_id: post_id ?? null,
      // `agent_activity` NO tiene columna `details` (esquema real, 20-sep-2026):
      // este insert fallaba entero y el webhook devolvía 500. Lo que manda el
      // cliente se guarda en output_summary, que sí existe.
      output_summary: typeof details === 'string' ? details : details ? JSON.stringify(details) : null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[webhook/agent-activity]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
