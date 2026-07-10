import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface DiscoveryRequest {
  client_id: string
  sector: string
  geo?: string
}

/**
 * Sales Engine Discovery Endpoint (Opción 3, Phase 1)
 *
 * Discovers leads by sector using Tavily
 * Returns: lead data ready for Apollo enrichment
 *
 * Flow:
 * 1. Tavily search: "logistics software companies in Spain"
 * 2. Score each lead against Dadybox ICP (Claude)
 * 3. Return hot/warm/cold leads
 * 4. Store in lead_discovery_results
 */
export async function POST(req: NextRequest) {
  try {
    const body: DiscoveryRequest = await req.json()
    const { client_id, sector, geo = 'Spain' } = body

    if (!client_id || !sector) {
      return NextResponse.json(
        { error: 'client_id and sector required' },
        { status: 400 }
      )
    }

    const db = createClient()
    const { data: userData } = await db.auth.getUser()

    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement Tavily search
    const tavilyResults = await searchTavily(sector, geo)

    // TODO: Score leads against Dadybox ICP using Claude
    const scoredLeads = await scoreLeadsAgainstICP(client_id, tavilyResults)

    // Store discovery results
    const { data: result, error } = await db
      .from('lead_discovery_results')
      .insert({
        client_id,
        created_by: userData.user.id,
        discovery_sector: sector,
        discovery_geo: geo,
        discovery_source: 'tavily',
        total_leads_found: scoredLeads.length,
        leads_data: scoredLeads,
        discovery_query: `${sector} companies in ${geo}`,
        status: 'success',
        completed_at: new Date().toISOString(),
        processing_time_ms: 0, // TODO: track actual time
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
      total_leads: scoredLeads.length,
      leads: scoredLeads.slice(0, 10),  // Return first 10
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

// TODO: Implement these functions with real Tavily + Claude APIs
async function searchTavily(sector: string, geo: string) {
  // Mock data for now
  return [
    {
      company: 'LogiTech Solutions',
      website: 'logitech-solutions.es',
      industry: 'Logistics Software',
      size: '50-200 employees',
      revenue: '€10-50M',
      description: '3PL management platform',
    },
    // ... more results
  ]
}

async function scoreLeadsAgainstICP(
  clientId: string,
  leads: any[]
) {
  // Dadybox ICP:
  // Industries: Logistics 3PL, Fulfillment, E-commerce
  // Size: 20-500 employees, €10-500M revenue
  // Geography: Spain, LATAM, Europe

  const scored = leads.map((lead: any) => ({
    ...lead,
    heat_score: Math.floor(Math.random() * 100),  // TODO: Real scoring
    icp_fit: 'high',  // TODO: Real ICP matching
  }))

  return scored
}
