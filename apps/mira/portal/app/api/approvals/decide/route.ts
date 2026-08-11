import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

// El raíl (fase 0 del plan del asesor): cerrar aprobar → publicar/usar →
// registrar. La página /approvals actualizaba SOLO approval_queue desde el
// navegador y post_history se quedaba en 'draft' para siempre — el loop roto
// que el diagnóstico (B2) señaló. Esta ruta, con service_role (post_history no
// tiene política UPDATE, a propósito: la escritura de historial es server-side),
// actualiza approval_queue y PROPAGA el estado a la fila de post_history
// enlazada por approval_queue.post_id.
//
// Acciones:
//   decision: 'approved' | 'approved_with_edits' | 'rejected'  → revisa la pieza
//   mark: 'published' | 'used'                                  → registra el uso real
//
// Mapa de estados approval_queue → post_history:
//   approved / approved_with_edits → 'approved'
//   rejected                       → 'rejected'
//   mark published/used            → 'published' + posted_at=now()

type Decision = 'approved' | 'approved_with_edits' | 'rejected'

const QUEUE_TO_HISTORY: Record<Decision, string> = {
  approved: 'approved',
  approved_with_edits: 'approved',
  rejected: 'rejected',
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const queueId: string | undefined = body.queueId
    const decision: Decision | undefined = body.decision
    const mark: 'published' | 'used' | undefined = body.mark
    const editedCopy: string | undefined = typeof body.copy === 'string' ? body.copy : undefined

    if (!queueId) return NextResponse.json({ error: 'Missing queueId' }, { status: 400 })
    if (!decision && !mark) {
      return NextResponse.json({ error: 'Missing decision or mark' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: item, error: fetchError } = await admin
      .from('approval_queue')
      .select('id, client_id, post_id, status')
      .eq('id', queueId)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, item.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const now = new Date().toISOString()

    // ── Revisión (aprobar / editar+aprobar / rechazar) ──
    if (decision) {
      const queueUpdate: Record<string, unknown> = { status: decision, reviewed_at: now }
      if (decision === 'approved_with_edits' && editedCopy) queueUpdate.copy = editedCopy
      const { error: qErr } = await admin.from('approval_queue').update(queueUpdate).eq('id', queueId)
      if (qErr) return NextResponse.json({ error: `approval_queue: ${qErr.message}` }, { status: 500 })

      // Propagar a post_history si la pieza está enlazada
      if (item.post_id) {
        await admin
          .from('post_history')
          .update({ status: QUEUE_TO_HISTORY[decision], approved_by: user.id })
          .eq('id', item.post_id)
      }
      return NextResponse.json({ success: true, decision, linked: Boolean(item.post_id) })
    }

    // ── Registrar uso real (marcar publicado/usado) ──
    // Cierra "publicar/usar → registrar resultado": el dato de B2 (qué se usó
    // de verdad) pasa a existir. calendar y performance ya esperan 'published'.
    if (item.post_id) {
      const { error: hErr } = await admin
        .from('post_history')
        .update({ status: 'published', posted_at: now })
        .eq('id', item.post_id)
      if (hErr) return NextResponse.json({ error: `post_history: ${hErr.message}` }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'This item has no linked history row to mark' }, { status: 409 })
    }
    return NextResponse.json({ success: true, mark: 'published' })
  } catch (error) {
    console.error('approvals/decide error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record decision' },
      { status: 500 }
    )
  }
}
