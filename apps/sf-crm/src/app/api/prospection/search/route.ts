import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getWorkspace } from '@/lib/workspaces'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, industries, jobTitles, companySizes, limit } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Get workspace and client_id
    const workspace = getWorkspace(session.workspace.id)
    if (!workspace || !workspace.clientId) {
      return NextResponse.json(
        { error: 'Workspace client ID not configured' },
        { status: 400 }
      )
    }

    // Call sf-sales-engine /leads/search endpoint
    const salesEngineUrl = process.env.SALES_ENGINE_API_URL || 'http://localhost:8000'
    const salesEngineKey = process.env.SALES_ENGINE_API_KEY

    if (!salesEngineKey) {
      console.error('SALES_ENGINE_API_KEY not configured')
      return NextResponse.json(
        { error: 'Sales engine not configured' },
        { status: 500 }
      )
    }

    const searchPayload = {
      client_id: workspace.clientId,
      company_domain: query, // Use query as domain search
      industries: industries || undefined,
      job_titles: jobTitles || undefined,
      company_sizes: companySizes || undefined,
      limit: Math.min(limit || 25, 100),
    }

    const response = await fetch(`${salesEngineUrl}/leads/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': salesEngineKey,
      },
      body: JSON.stringify(searchPayload),
    })

    // Handle payment limit exceeded
    if (response.status === 402) {
      const errorData = await response.json()
      return NextResponse.json(
        {
          error: 'Monthly API limit exceeded',
          detail: errorData.detail,
        },
        { status: 402 }
      )
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Sales engine error:', response.status, errorData)
      return NextResponse.json(
        { error: errorData.detail || 'Failed to search prospects' },
        { status: response.status || 500 }
      )
    }

    const data = await response.json()

    // Transform sf-sales-engine response to sf-crm format
    const results = (data.leads || []).map((lead: any) => ({
      firstName: lead.first_name,
      lastName: lead.last_name,
      company: lead.company_name,
      title: lead.title,
      email: lead.email,
      emailVerified: lead.email_verified || false,
      linkedinUrl: lead.linkedin_url,
      industry: lead.industry,
      geography: lead.geography,
    }))

    return NextResponse.json({
      success: true,
      results,
      totalCount: results.length,
      costUsd: data.cost_usd,
      monthlySpendUsd: data.monthly_spend_usd,
      monthlyLimitUsd: data.monthly_limit_usd,
      hitsLimit: data.hits_limit,
    })
  } catch (error) {
    console.error('Prospection search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to search prospects',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
