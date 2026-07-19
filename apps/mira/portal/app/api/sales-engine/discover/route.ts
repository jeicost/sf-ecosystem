import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'

interface DiscoveryRequest {
  client_id: string
  sector: string
  geo?: string
  limit?: number
}

/**
 * Sales Engine Discovery — discovery "profundo" vía motor Python (Fase C).
 *
 * Antes: mock (Tavily "NOT IMPLEMENTED" + scoring aleatorio). Ahora llama al
 * motor real sf-sales-engine (`POST {SALES_ENGINE_API_URL}/leads/search`,
 * Apollo + Hunter + cache + cost tracking) — el mismo endpoint que ya consume
 * sf-crm Prospection (auth por header X-API-Key).
 *
 * El discovery "ligero" (Tavily) sigue siendo /api/comercial/discovery.
 * Si el motor no responde → 503 claro, NUNCA volver al mock.
 */
export async function POST(req: NextRequest) {
  try {
    const body: DiscoveryRequest = await req.json()
    const { client_id, sector, geo = 'Spain', limit = 25 } = body

    if (!client_id || !sector) {
      return NextResponse.json(
        { error: 'client_id and sector required' },
        { status: 400 }
      )
    }

    // Auth de sesión + tenant (patrón Fase A) — antes esta ruta era anon
    const resolved = await resolveRequestClient(client_id)
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    const clientId = resolved.clientId

    const engineUrl = process.env.SALES_ENGINE_API_URL
    const engineKey = process.env.SALES_ENGINE_API_KEY
    if (!engineUrl || !engineKey) {
      return NextResponse.json({ error: 'Motor de discovery no disponible' }, { status: 503 })
    }

    const startedAt = Date.now()
    let engineData: {
      leads?: unknown[]
      total?: number
      cost_usd?: number
      monthly_spend_usd?: number
      monthly_limit_usd?: number
      hits_limit?: boolean
    }
    try {
      const engineRes = await fetch(`${engineUrl}/leads/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': engineKey,
        },
        body: JSON.stringify({
          client_id: clientId,
          industries: [sector],
          geographies: geo ? [geo] : undefined,
          limit: Math.min(limit, 100),
        }),
      })

      if (engineRes.status === 402) {
        const err = await engineRes.json().catch(() => ({}))
        return NextResponse.json(
          { error: 'Monthly API limit exceeded', detail: err.detail },
          { status: 402 }
        )
      }
      if (!engineRes.ok) {
        const err = await engineRes.json().catch(() => ({}))
        console.error('Sales engine discovery error:', engineRes.status, err)
        return NextResponse.json({ error: 'Motor de discovery no disponible' }, { status: 503 })
      }
      engineData = await engineRes.json()
    } catch (fetchErr) {
      console.error('Sales engine unreachable:', fetchErr)
      return NextResponse.json({ error: 'Motor de discovery no disponible' }, { status: 503 })
    }

    const leads = engineData.leads ?? []

    // Store discovery results (misma tabla que antes: lead_discovery_results)
    const db = adminClient()
    const { data: result, error } = await db
      .from('lead_discovery_results')
      .insert({
        client_id: clientId,
        created_by: resolved.userId,
        discovery_sector: sector,
        discovery_geo: geo,
        discovery_source: 'sales-engine-apollo',
        total_leads_found: leads.length,
        leads_data: leads,
        discovery_query: `${sector} companies in ${geo}`,
        status: 'success',
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startedAt,
      })
      .select()
      .single()

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      discovery_id: result.id,
      total_leads: leads.length,
      leads: leads.slice(0, 10),
      cost_usd: engineData.cost_usd,
      monthly_spend_usd: engineData.monthly_spend_usd,
      monthly_limit_usd: engineData.monthly_limit_usd,
      hits_limit: engineData.hits_limit,
      next_phase: 'enrichment - Apollo/Hunter data lookup',
    })
  } catch (error) {
    console.error('Discovery error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    )
  }
}
