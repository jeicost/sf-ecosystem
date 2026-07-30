import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'

// P6 — propuestas de cambio al brain pendientes/resueltas del cliente activo.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const status = searchParams.get('status') || 'pending'
    // Paginación real (Fase 2) -- antes un .limit(30) fijo dejaba huérfanas en
    // silencio las propuestas más antiguas de un cliente con mucho volumen
    // (p.ej. tras conectar la síntesis automática de Drive).
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10) || 30, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    const { data, error, count } = await adminClient()
      .from('brain_change_proposals')
      .select('id, origin, status, summary, changes, created_at, applied_at', { count: 'exact' })
      .eq('client_id', access.clientId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.message.includes('brain_change_proposals')) {
        return NextResponse.json({ proposals: [], pending_migration: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const total = count ?? data?.length ?? 0
    return NextResponse.json({ proposals: data ?? [], total, hasMore: offset + (data?.length ?? 0) < total })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
