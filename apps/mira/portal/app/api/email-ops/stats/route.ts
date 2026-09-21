import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { computeOpsStats, type StatsTicket } from '@/lib/email-ops/stats'
import { getClientSettings } from '@/lib/email-ops/learning'
import { getSchemaForClient } from '@/lib/email-ops/schema'

// Cifras del panel de operación. El cliente lo acota requireEmailOps en
// servidor — nunca el client_id que mande el navegador —, que es la frontera
// multi-marca: un usuario del grupo con varias marcas solo ve la activa.
//
// ?days=30|90 limita por fecha de llegada del encargo (first_message_at);
// sin days, todo el histórico.

const COLS = 'kind,status,service_date,delivery_type,urgency,missing_fields,first_message_at,from_address,fields'
const MAX_ROWS = 5000

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireEmailOps(q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const days = Number(q.get('days'))
    let query = adminClient().from('email_tickets').select(COLS).eq('client_id', access.clientId)
    if (Number.isFinite(days) && days > 0) {
      query = query.gte('first_message_at', new Date(Date.now() - days * 86400000).toISOString())
    }
    const { data, error } = await query.limit(MAX_ROWS)
    if (error) throw error

    const rows = (data || []) as unknown as StatsTicket[]
    const stats = computeOpsStats(rows)
    // Etiquetas de los campos que faltan, del esquema de ESTE cliente (GLS usa
    // courier_gls_v1): la clave interna "recogida_direccion" no se enseña.
    const schema = getSchemaForClient(await getClientSettings(adminClient(), access.clientId))
    const fieldLabels = Object.fromEntries(
      schema.filter((f) => stats.missing.some((m) => m.field === f.key)).map((f) => [f.key, f.labels])
    )
    return NextResponse.json({
      stats,
      fieldLabels,
      // Si se llega al tope, el panel lo dice en vez de enseñar totales cortos.
      truncated: rows.length >= MAX_ROWS,
    })
  } catch (error) {
    console.error('email-ops/stats error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
