import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { generateQuickAction, QuickActionError } from '@/lib/quick-actions/generate'

export const maxDuration = 300

// Reintenta una quick action fallida reutilizando su fila (mismo action_id,
// mismos inputs) — el polling del cliente no tiene que cambiar de id.
export async function POST(req: NextRequest) {
  try {
    const { action_id } = await req.json()
    if (!action_id) {
      return NextResponse.json({ error: 'Missing action_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: row, error } = await admin
      .from('quick_actions_results')
      .select('id, client_id, user_id, department, action_type, input_data, status, created_at')
      .eq('id', action_id)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    // Solo se reintentan fallos (o zombis processing viejos que el reaper aún
    // no tocó) — nunca pisar una generación success ni una en curso reciente.
    const ageMs = Date.now() - new Date(row.created_at).getTime()
    const stuck = row.status === 'processing' && ageMs > 10 * 60 * 1000
    if (row.status !== 'failed' && !stuck) {
      return NextResponse.json(
        { error: `Cannot retry an action with status '${row.status}'` },
        { status: 409 }
      )
    }

    const result = await generateQuickAction({
      clientId: row.client_id,
      userId: row.user_id,
      department: row.department,
      actionType: row.action_type,
      inputData: row.input_data ?? {},
      existingActionId: row.id,
    })

    return NextResponse.json({
      success: true,
      action_id: result.actionId,
      output_data: result.outputData,
      processing_time_ms: result.processingTimeMs,
    })
  } catch (error) {
    console.error('Quick action retry error:', error)
    const status = error instanceof QuickActionError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retry failed' },
      { status }
    )
  }
}
