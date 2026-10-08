import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { enqueueCommercialDocuments, submitBatch, collectBatch, camposARevisar, type Ficha } from '@/lib/comercial/fichas'

export const runtime = 'nodejs'
export const maxDuration = 120
export const TOOL_ID = 'commercial-memory'

/**
 * GET /api/comercial/fichas?clientId=&status=&q=&scope=
 * Fichas de la marca (con los campos a revisar calculados) y el estado de la cola.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const access = await requireTool(TOOL_ID, url.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    let query = db.from('commercial_fichas').select('*').eq('client_id', access.clientId)
    const status = url.searchParams.get('status')
    if (status && ['extracted', 'reviewed', 'discarded'].includes(status)) query = query.eq('status', status)
    const scope = url.searchParams.get('scope')
    if (scope) query = query.eq('service_scope', scope)
    const q = (url.searchParams.get('q') || '').trim()
    if (q) query = query.or(`customer_name.ilike.%${q.replace(/[%,]/g, '')}%,service_summary.ilike.%${q.replace(/[%,]/g, '')}%,source_path.ilike.%${q.replace(/[%,]/g, '')}%`)
    const { data: fichas, error } = await query.order('doc_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(500)
    if (error) throw error

    const [{ data: jobs }, { data: batches }] = await Promise.all([
      db.from('commercial_extraction_jobs').select('status').eq('client_id', access.clientId).limit(20000),
      db.from('commercial_batches').select('id,status,request_count,succeeded,errored,submitted_at').eq('client_id', access.clientId).order('submitted_at', { ascending: false }).limit(5),
    ])
    const cola: Record<string, number> = {}
    for (const j of jobs || []) cola[j.status] = (cola[j.status] || 0) + 1

    return NextResponse.json({
      fichas: (fichas || []).map((f) => ({ ...f, revisar: camposARevisar(f as unknown as Ficha & Record<string, unknown>) })),
      cola,
      lotes: batches || [],
      canManage: access.isAgency,
    })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

/**
 * POST /api/comercial/fichas  Body: { clientId, action: 'enqueue' | 'submit' | 'collect' }
 * Acciones de la agencia sobre la cola: encolar los documentos comerciales,
 * enviar un lote ahora, recoger los lotes terminados.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; action?: string }
    const access = await requireTool(TOOL_ID, body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can run extractions' }, { status: 403 })
    const db = adminClient()
    if (body.action === 'enqueue') {
      const n = await enqueueCommercialDocuments(db, access.clientId)
      return NextResponse.json({ ok: true, enqueued: n })
    }
    if (body.action === 'submit') {
      const n = await enqueueCommercialDocuments(db, access.clientId)
      const r = await submitBatch(db, access.clientId)
      return NextResponse.json({ ok: true, enqueued: n, ...r })
    }
    if (body.action === 'collect') {
      const { data: open } = await db.from('commercial_batches').select('id').eq('client_id', access.clientId).in('status', ['in_progress', 'ended']).limit(10)
      const results = []
      for (const b of open || []) results.push({ id: b.id, ...(await collectBatch(db, b.id)) })
      return NextResponse.json({ ok: true, results })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
