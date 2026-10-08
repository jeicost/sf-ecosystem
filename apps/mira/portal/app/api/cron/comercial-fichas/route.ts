import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { collectBatch, submitBatch, enqueueCommercialDocuments } from '@/lib/comercial/fichas'

// Fichas de condiciones comerciales por lotes (vercel.json: cada 30 minutos).
// 1) Recoge los lotes terminados (fichas a BD, uso a mitad de precio).
// 2) Encola los documentos comerciales nuevos y envía UN lote por marca con lo
//    pendiente (hasta 100 documentos). El freno mensual de la marca se
//    comprueba antes de enviar (getClaudeForClient con ruta).
// Invocado por Vercel con Authorization: Bearer CRON_SECRET.

export const maxDuration = 300
const RUN_BUDGET_MS = 240_000

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const started = Date.now()
  const db = adminClient()
  const out: Record<string, unknown> = { collected: [], submitted: [] }

  // 1. Lotes abiertos
  const { data: open } = await db.from('commercial_batches').select('id, client_id').in('status', ['in_progress', 'ended']).order('submitted_at').limit(10)
  const collected: Array<{ id: string; ok: boolean; detail: string }> = []
  for (const b of open || []) {
    if (Date.now() - started > RUN_BUDGET_MS) break
    try {
      const r = await collectBatch(db, b.id)
      collected.push({ id: b.id, ok: true, detail: r.collected ? `${r.succeeded} ok, ${r.errored} errored` : 'still processing' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'collect failed'
      collected.push({ id: b.id, ok: false, detail: msg.slice(0, 120) })
      await db.from('commercial_batches').update({ error: msg.slice(0, 300) }).eq('id', b.id)
    }
  }
  out.collected = collected

  // 2. Encolar y enviar, marca a marca (las que tienen carpetas comerciales)
  const { data: folders } = await db.from('microsoft_folders').select('client_id').eq('purpose', 'commercial')
  const clientIds = Array.from(new Set((folders || []).map((f) => f.client_id)))
  const submitted: Array<{ client: string; ok: boolean; detail: string }> = []
  for (const clientId of clientIds) {
    if (Date.now() - started > RUN_BUDGET_MS) break
    try {
      const enqueued = await enqueueCommercialDocuments(db, clientId)
      // Un lote por marca y pasada; si ya hay uno en curso, se espera a recogerlo.
      const { count: inFlight } = await db.from('commercial_batches').select('id', { count: 'exact', head: true }).eq('client_id', clientId).in('status', ['in_progress', 'ended'])
      if ((inFlight || 0) > 0) { submitted.push({ client: clientId, ok: true, detail: `${enqueued} enqueued; batch in flight` }); continue }
      const r = await submitBatch(db, clientId)
      submitted.push({ client: clientId, ok: true, detail: `${enqueued} enqueued; ${r.submitted} submitted${r.batchId ? ` (${r.batchId})` : ''}; ${r.skipped} skipped` })
    } catch (e) {
      submitted.push({ client: clientId, ok: false, detail: (e instanceof Error ? e.message : 'submit failed').slice(0, 160) })
    }
  }
  out.submitted = submitted
  return NextResponse.json(out)
}
