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
    const { data, error } = await adminClient()
      .from('brain_change_proposals')
      .select('id, origin, status, summary, changes, created_at, applied_at')
      .eq('client_id', access.clientId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      if (error.message.includes('brain_change_proposals')) {
        return NextResponse.json({ proposals: [], pending_migration: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ proposals: data ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
