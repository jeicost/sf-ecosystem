import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'
import { resolveRequestClient } from '@/lib/resolve-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const auth = await resolveRequestClient(clientId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const db = createServiceClient()

    // Get recent generations from generation_queue
    const { data: generations } = await db
      .from('generation_queue')
      .select('id, tool_slug, created_at, status')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    const deliveries = (generations || []).map(gen => ({
      id: gen.id,
      date: gen.created_at,
      tool: formatToolName(gen.tool_slug),
      status: gen.status === 'completed' ? 'delivered' : gen.status || 'generated',
      size: '—',
    }))

    return NextResponse.json(deliveries)
  } catch (error) {
    console.error('Error in client-portal deliveries:', error)
    return NextResponse.json([], { status: 200 })
  }
}

function formatToolName(slug: string): string {
  const names: Record<string, string> = {
    'brand-briefing': 'Brand Briefing',
    'content-pack': 'Content Pack',
    'action-plan': 'Action Plan',
    'investor-deck': 'Investor Deck',
    'competitive-analysis': 'Análisis Competitivo',
    'brandbook-content-system': 'Brandbook Content System',
    'marketing-campaign-generator': 'Marketing Campaign',
    'community-growth-blueprint': 'Community Growth',
    'seo-audit': 'SEO Audit',
    'marketing-audit': 'Marketing Audit',
  }
  return names[slug] || slug
}
