import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getClientApiKey } from '@/lib/integrations/getClientApiKey'

interface EnrichmentRequest {
  client_id: string
  discovery_result_id: string
}

interface DiscoveredLead {
  company_name?: string
  company?: string // shape antiguo del mock, por compatibilidad
  company_website?: string
  website?: string
  industry?: string
  heat_score?: number
}

/**
 * Sales Engine Enrichment — vía motor Python (Fase C).
 *
 * Antes: mock (Apollo stub + email personalizado con Claude). Ahora, por cada
 * empresa del discovery, pide contactos reales al motor
 * (`POST {SALES_ENGINE_API_URL}/leads/search` con company_domain — Apollo por
 * dominio + verificación Hunter + cache).
 *
 * Ya NO genera emails personalizados: el icebreaker canónico del ecosistema es
 * /api/comercial/icebreaker (decisión 2026-07-19, docs/crm-architecture.md).
 * Si el motor no responde → 503 claro, NUNCA volver al mock.
 */
export async function POST(req: NextRequest) {
  try {
    const body: EnrichmentRequest = await req.json()
    const { client_id, discovery_result_id } = body

    if (!client_id || !discovery_result_id) {
      return NextResponse.json(
        { error: 'client_id and discovery_result_id required' },
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

    const [apolloKey, hunterKey] = await Promise.all([
      getClientApiKey(clientId, 'apollo'),
      getClientApiKey(clientId, 'hunter'),
    ])
    if (!apolloKey || !hunterKey) {
      return NextResponse.json({ error: 'apollo_hunter_not_connected' }, { status: 400 })
    }

    const db = adminClient()

    // Fetch discovery results — scoped al cliente validado
    const { data: discovery, error: discoveryError } = await db
      .from('lead_discovery_results')
      .select('*')
      .eq('id', discovery_result_id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (discoveryError || !discovery) {
      return NextResponse.json(
        { error: 'Discovery result not found' },
        { status: 404 }
      )
    }

    const enrichedLeads = []
    const sourceLeads: DiscoveredLead[] = Array.isArray(discovery.leads_data) ? discovery.leads_data : []

    for (const lead of sourceLeads.slice(0, 5)) {
      const companyName = lead.company_name ?? lead.company ?? null
      const domain = lead.company_website ?? lead.website ?? null
      if (!companyName && !domain) continue

      // Contactos reales vía motor Python (Apollo domain search + Hunter + cache)
      let persons: unknown[] = []
      try {
        const engineRes = await fetch(`${engineUrl}/leads/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': engineKey,
          },
          body: JSON.stringify({
            client_id: clientId,
            company_domain: domain ?? companyName,
            limit: 5,
            apollo_api_key: apolloKey,
            hunter_api_key: hunterKey,
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
          console.error('Sales engine enrich error:', engineRes.status, err)
          return NextResponse.json({ error: 'Motor de discovery no disponible' }, { status: 503 })
        }
        const engineData = await engineRes.json()
        persons = engineData.leads ?? []
      } catch (fetchErr) {
        console.error('Sales engine unreachable:', fetchErr)
        return NextResponse.json({ error: 'Motor de discovery no disponible' }, { status: 503 })
      }

      // Save enrichment result (misma tabla que antes: apollo_enrichment_results)
      const { data: enrichResult } = await db
        .from('apollo_enrichment_results')
        .insert({
          client_id: clientId,
          created_by: resolved.userId,
          discovery_result_id,
          company_name: companyName,
          industry: lead.industry ?? null,
          website: domain,
          heat_score: lead.heat_score ?? null,
          apollo_data: { persons, source: 'sales-engine' },
          crm_ready: persons.length > 0,
          status: 'ready',
        })
        .select()
        .single()

      if (enrichResult) enrichedLeads.push(enrichResult)
    }

    return NextResponse.json({
      success: true,
      enriched_count: enrichedLeads.length,
      leads: enrichedLeads,
      next_phase: 'sync to CRM (crm_contacts table)',
    })
  } catch (error) {
    console.error('Enrichment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrichment failed' },
      { status: 500 }
    )
  }
}
