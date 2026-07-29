import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { saveFeedback } from '@/lib/feedback'

// Feedback de documentos/informes (B4): 👍/👎 + nota por informe. Las notas
// negativas se reinyectan en la siguiente generación del mismo tool para el
// mismo cliente (ver toolkit/generate y documents/refine).
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { queue_id, action_id, outcome, note } = await req.json()
    if ((!queue_id && !action_id) || !['helpful', 'not_helpful'].includes(outcome)) {
      return NextResponse.json({ error: 'Missing queue_id/action_id or invalid outcome' }, { status: 400 })
    }

    const admin = adminClient()
    let clientId: string
    let toolKey: string
    let context: 'toolkit' | 'document' | 'quick_action' | 'monthly'

    if (queue_id) {
      const { data: generation } = await admin
        .from('generation_queue')
        .select('id, client_id, tool_slug')
        .eq('id', queue_id)
        .maybeSingle()
      if (!generation) {
        return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
      }
      clientId = generation.client_id
      toolKey = generation.tool_slug
      context = generation.tool_slug === 'monthly-content-system'
        ? 'monthly'
        : generation.tool_slug.startsWith('doc-') ? 'document' : 'toolkit'
    } else {
      // P3: feedback sobre resultados de quick actions
      const { data: action } = await admin
        .from('quick_actions_results')
        .select('id, client_id, action_type')
        .eq('id', action_id)
        .maybeSingle()
      if (!action) {
        return NextResponse.json({ error: 'Action result not found' }, { status: 404 })
      }
      clientId = action.client_id
      toolKey = action.action_type
      context = 'quick_action'
    }

    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const result = await saveFeedback({
      clientId,
      outcome,
      toolKey,
      queueId: queue_id ?? null,
      actionId: action_id ?? null,
      context,
      note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 1000) : null,
      createdBy: user.id,
    })
    if (!result.ok) {
      if (result.error?.includes('document_feedback')) {
        return NextResponse.json(
          { error: 'El sistema de feedback aún no está activo (falta aplicar la migración 0050).' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('document-feedback error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
