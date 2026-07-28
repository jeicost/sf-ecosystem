import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

// Feedback de documentos/informes (B4): 👍/👎 + nota por informe. Las notas
// negativas se reinyectan en la siguiente generación del mismo tool para el
// mismo cliente (ver toolkit/generate y documents/refine).
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { queue_id, outcome, note } = await req.json()
    if (!queue_id || !['helpful', 'not_helpful'].includes(outcome)) {
      return NextResponse.json({ error: 'Missing queue_id or invalid outcome' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: generation } = await admin
      .from('generation_queue')
      .select('id, client_id, tool_slug')
      .eq('id', queue_id)
      .maybeSingle()
    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, generation.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const { error } = await admin.from('document_feedback').insert({
      client_id: generation.client_id,
      queue_id,
      tool_slug: generation.tool_slug,
      outcome,
      note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 1000) : null,
      created_by: user.id,
    })
    if (error) {
      // Pre-0050: la tabla aún no existe — degradar con mensaje claro
      if (error.message.includes('document_feedback')) {
        return NextResponse.json(
          { error: 'El sistema de feedback aún no está activo (falta aplicar la migración 0050).' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
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
