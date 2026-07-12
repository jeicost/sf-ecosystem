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

// Tavily integration (NOT IMPLEMENTED)
async function searchTavily(sector: string, geo: string) {
  // Tavily requires:
  // - TAVILY_API_KEY environment variable
  // - Valid API key from tavily.com dashboard
  // - Proper rate limiting per tier

  if (!process.env.TAVILY_API_KEY) {
    return [
      {
        status: 'not_connected',
        sector,
        geo,
        message: 'Tavily integration not configured. Contact admin to enable.',
        documentation: 'https://docs.tavily.com/docs/tavily-api',
      },
    ]
  }

  // TODO: Implement real Tavily API call
  // Example: fetch('https://api.tavily.com/search', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ api_key: TAVILY_API_KEY, query: `${sector} companies in ${geo}` })
  // })

  return [
    {
      status: 'not_connected',
      sector,
      geo,
      message: 'Tavily integration pending implementation',
    },
  ]
}

async function scoreLeadsAgainstICP(clientId: string, leads: any[]) {
  // ICP scoring requires Claude analysis
  // Current implementation: MOCK (returns random scores)
  // Real implementation: Claude analyzes lead vs ICP profile from client_documentation

  return leads.map((lead: any) => ({
    ...lead,
    heat_score: lead.status === 'not_connected' ? 0 : Math.random(),
    icp_fit: lead.status === 'not_connected' ? 'not_connected' : 'unknown',
    note: 'ICP scoring disabled until Tavily + Claude integration complete',
  }))
}
