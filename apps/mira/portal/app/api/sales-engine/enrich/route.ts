import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

interface EnrichmentRequest {
  client_id: string
  discovery_result_id: string
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Sales Engine Enrichment Endpoint (Opción 3, Phase 2)
 *
 * Enriches leads with:
 * 1. Apollo.io: Find decision makers (names, emails, phones)
 * 2. Hunter.io (fallback): Email verification
 * 3. Claude: Generate personalized cold email using company handbook
 *
 * Returns: enriched lead data ready for CRM sync
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

    const db = createClient()
    const { data: userData } = await db.auth.getUser()

    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch discovery results
    const { data: discovery, error: discoveryError } = await db
      .from('lead_discovery_results')
      .select('*')
      .eq('id', discovery_result_id)
      .single()

    if (discoveryError || !discovery) {
      return NextResponse.json(
        { error: 'Discovery result not found' },
        { status: 404 }
      )
    }

    // Enrich each lead
    const enrichedLeads = []

    if (discovery.leads_data && Array.isArray(discovery.leads_data)) {
      for (const lead of discovery.leads_data.slice(0, 5)) {  // Limit to 5 for demo
        // TODO: Call Apollo.io API
        const apolloData = await enrichViaApollo(lead.company)

        // TODO: Fetch company handbook context
        const handbookContext = await fetchCompanyContext(client_id)

        // Generate personalized email via Claude
        const personalizedEmail = await generatePersonalizedEmail(
          lead,
          apolloData,
          handbookContext
        )

        // Save enrichment result
        const { data: enrichResult } = await db
          .from('apollo_enrichment_results')
          .insert({
            client_id,
            created_by: userData.user.id,
            discovery_result_id,
            company_name: lead.company,
            industry: lead.industry,
            website: lead.website,
            heat_score: lead.heat_score,
            apollo_data: apolloData,
            company_handbook_context: handbookContext,
            personalization_email: personalizedEmail,
            crm_ready: true,
            status: 'ready',
          })
          .select()
          .single()

        enrichedLeads.push({
          ...enrichResult,
          personalization_email: personalizedEmail,
        })
      }
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

// Apollo.io integration (NOT IMPLEMENTED)
async function enrichViaApollo(companyName: string) {
  // Apollo.io API requires:
  // - APOLLO_API_KEY environment variable
  // - Valid API key from apollo.io dashboard
  // - Proper rate limiting (1000 calls/month on free tier)

  if (!process.env.APOLLO_API_KEY) {
    return {
      status: 'not_connected',
      company: companyName,
      message: 'Apollo.io integration not configured. Contact admin to enable.',
      documentation: 'https://apolloio.gitbook.io/apollo-api/getting-started/authentication',
    }
  }

  // TODO: Implement real Apollo.io API call
  // Example: fetch('https://api.apollo.io/v1/companies/match', {
  //   method: 'POST',
  //   headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
  //   body: JSON.stringify({ domain: website })
  // })

  return {
    status: 'not_connected',
    company: companyName,
    message: 'Apollo.io integration pending implementation',
  }
}

async function fetchCompanyContext(clientId: string) {
  // Fetch company handbook from client_documentation
  try {
    const res = await fetch('http://localhost:3000/api/agent/context/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        context_type: 'company',
        query: 'company mission, products, target customers, value proposition',
        limit: 1,
      }),
    })
    const data = await res.json()
    return data.documents?.[0]?.excerpt || 'No company context available'
  } catch {
    return 'No company context available'
  }
}

async function generatePersonalizedEmail(
  lead: any,
  apolloData: any,
  handbookContext: string
) {
  const contactName = apolloData.persons?.[0]?.name || 'Team'

  const message = await claude.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Write a personalized cold email for a sales prospect.

PROSPECT:
- Company: ${lead.company}
- Contact: ${contactName}
- Industry: ${lead.industry}
- Website: ${lead.website}

OUR OFFERING (from Dadybox handbook):
${handbookContext}

Requirements:
- Short (3-4 sentences max)
- Reference something specific from their website or industry
- Make it personal, not templated
- Include clear CTA
- Professional but conversational tone

Email:`,
      },
    ],
  })

  const textContent = message.content[0]
  return textContent.type === 'text' ? textContent.text : ''
}
