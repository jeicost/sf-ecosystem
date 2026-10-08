import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { writable } from '@/lib/db-json'
import { parseFicha, camposARevisar, type Ficha } from '@/lib/comercial/fichas'

const TOOL_ID = 'commercial-memory'

/**
 * PATCH /api/comercial/fichas/[id]  Body: { clientId, status?, notes?, ficha? }
 * Revisar (reviewed), descartar (discarded) o corregir campos de una ficha.
 * Lo corregido a mano pasa a confianza 1 (ya no está «para revisar»).
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; status?: string; notes?: string; ficha?: Record<string, unknown> }
    const access = await requireTool(TOOL_ID, body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data: current } = await db.from('commercial_fichas').select('*').eq('id', id).eq('client_id', access.clientId).maybeSingle()
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status && ['extracted', 'reviewed', 'discarded'].includes(body.status)) {
      patch.status = body.status
      if (body.status === 'reviewed') { patch.reviewed_by = access.userId; patch.reviewed_at = new Date().toISOString() }
    }
    if (typeof body.notes === 'string') patch.notes = body.notes.trim().slice(0, 1000) || null
    if (body.ficha && typeof body.ficha === 'object') {
      // Se reparsea con la misma coerción que la extracción: nada entra sin pasar por ella.
      const merged = parseFicha({ ...(current as Record<string, unknown>), ...body.ficha, confidence: { ...(current.confidence as Record<string, number>), ...Object.fromEntries(Object.keys(body.ficha).map((k) => [k, 1])) }, evidence: current.evidence })
      Object.assign(patch, {
        doc_kind: merged.doc_kind, doc_date: merged.doc_date, customer_name: merged.customer_name || null, customer_sector: merged.customer_sector || null,
        customer_contact: merged.customer_contact || null, service_scope: merged.service_scope || null, service_summary: merged.service_summary || null,
        conditions: merged.conditions, surcharges: merged.surcharges, discounts: merged.discounts || null, payment_terms: merged.payment_terms || null,
        commitments: merged.commitments, volume_estimate: merged.volume_estimate || null, validity_from: merged.validity_from, validity_to: merged.validity_to,
        outcome: merged.outcome, confidence: merged.confidence,
      })
    }
    const { data, error } = await db.from('commercial_fichas').update(writable(patch)).eq('id', id).eq('client_id', access.clientId).select('*').single()
    if (error) throw error
    return NextResponse.json({ ficha: { ...data, revisar: camposARevisar(data as unknown as Ficha & Record<string, unknown>) } })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
