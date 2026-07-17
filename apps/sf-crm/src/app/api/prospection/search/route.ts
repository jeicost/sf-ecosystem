import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getWorkspace } from '@/lib/workspaces'
import { handleApiError } from '@/lib/api-errors'

// Mock data for local development/testing
const MOCK_LEADS = [
  {
    first_name: 'Sarah',
    last_name: 'Chen',
    email: 'sarah.chen@acme.com',
    email_verified: true,
    title: 'VP of Sales',
    company_name: 'ACME Corp',
    company_website: 'acme.com',
    industry: 'Technology',
    geography: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/sarahchen',
  },
  {
    first_name: 'Michael',
    last_name: 'Rodriguez',
    email: 'mrodriguez@acme.com',
    email_verified: true,
    title: 'Head of Growth',
    company_name: 'ACME Corp',
    company_website: 'acme.com',
    industry: 'Technology',
    geography: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/mrodriguez',
  },
  {
    first_name: 'Elena',
    last_name: 'Kowalski',
    email: 'elena@acme.com',
    email_verified: false,
    title: 'Product Lead',
    company_name: 'ACME Corp',
    company_website: 'acme.com',
    industry: 'Technology',
    geography: 'New York, NY',
    linkedin_url: 'https://linkedin.com/in/ekowalski',
  },
  {
    first_name: 'James',
    last_name: 'Smith',
    email: 'james.smith@acme.com',
    email_verified: true,
    title: 'Engineering Manager',
    company_name: 'ACME Corp',
    company_website: 'acme.com',
    industry: 'Technology',
    geography: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/jsmith',
  },
  {
    first_name: 'Amanda',
    last_name: 'Lee',
    email: 'amanda.lee@acme.com',
    email_verified: true,
    title: 'Marketing Director',
    company_name: 'ACME Corp',
    company_website: 'acme.com',
    industry: 'Technology',
    geography: 'Austin, TX',
    linkedin_url: 'https://linkedin.com/in/alee',
  },
]

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
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
        { error: 'Prospection search is not configured for this workspace yet' },
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

    // For development with mock API key, return mock data
    if (salesEngineKey === 'dev-local-test-key-2026') {
      const mockLimit = Math.min(limit || 25, 5)
      const mockLeads = MOCK_LEADS.slice(0, mockLimit)

      // Simulate realistic cost metrics
      const costUsd = mockLeads.length * 0.015 // $0.015 per lead from Apollo
      const monthlySpendUsd = 2.45 // Simulate some prior usage
      const monthlyLimitUsd = 150.0
      const hitsLimit = (monthlySpendUsd + costUsd) / monthlyLimitUsd >= 0.9

      const results = mockLeads.map((lead) => ({
        firstName: lead.first_name,
        lastName: lead.last_name,
        company: lead.company_name,
        title: lead.title,
        email: lead.email,
        emailVerified: lead.email_verified,
        linkedinUrl: lead.linkedin_url,
        industry: lead.industry,
        geography: lead.geography,
      }))

      return NextResponse.json({
        success: true,
        results,
        totalCount: results.length,
        costUsd,
        monthlySpendUsd: monthlySpendUsd + costUsd,
        monthlyLimitUsd,
        hitsLimit,
      })
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
    return handleApiError(error, 'Failed to search prospects')
  }
}
