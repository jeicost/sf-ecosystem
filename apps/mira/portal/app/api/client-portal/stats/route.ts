import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'
import { resolveRequestClient } from '@/lib/resolve-client'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const auth = await resolveRequestClient(clientId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const db = createServiceClient()

    // Query real generation data
    let contentGenerated = 0
    try {
      const { count } = await db
        .from('generation_queue')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
      contentGenerated = count || 0
    } catch (e) {
      console.error('Error fetching generations:', e)
    }

    // Query toolkit usage (how many generations per tool)
    let toolsUsed = 0
    try {
      const { data: toolCounts } = await db
        .from('generation_queue')
        .select('tool_slug')
        .eq('client_id', clientId)

      if (toolCounts && toolCounts.length > 0) {
        const uniqueTools = new Set(toolCounts.map(t => t.tool_slug))
        toolsUsed = uniqueTools.size
      }
    } catch (e) {
      console.error('Error fetching tools:', e)
    }

    // Calculate time saved (estimate: 2 hours per generation)
    const timeSavedHours = contentGenerated * 2

    // Quick actions executed
    let quickActionsExecuted = 0
    try {
      const { count } = await db
        .from('quick_actions_results')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
      quickActionsExecuted = count || 0
    } catch (e) {
      console.error('Error fetching quick actions:', e)
    }

    // Get tool-specific stats
    const toolStats: Record<string, any> = {}
    try {
      const { data: toolData } = await db
        .from('generation_queue')
        .select('tool_slug, created_at')
        .eq('client_id', clientId)

      if (toolData) {
        // Group by tool and count
        toolData.forEach(item => {
          const tool = item.tool_slug
          if (!toolStats[tool]) {
            toolStats[tool] = { uses: 0, lastUsed: null }
          }
          toolStats[tool].uses += 1
          const itemDate = new Date(item.created_at)
          if (!toolStats[tool].lastUsed || itemDate > new Date(toolStats[tool].lastUsed)) {
            toolStats[tool].lastUsed = item.created_at
          }
        })
      }
    } catch (e) {
      console.error('Error fetching tool stats:', e)
    }

    // Query ratings from generation_feedback
    const toolRatings: Record<string, { sum: number; count: number }> = {}
    try {
      const { data: feedbackData } = await db
        .from('deliverables')
        .select(`
          tool_slug,
          generation_feedback (rating)
        `)
        .eq('client_id', clientId)

      if (feedbackData) {
        feedbackData.forEach(item => {
          const tool = item.tool_slug
          if (!toolRatings[tool]) {
            toolRatings[tool] = { sum: 0, count: 0 }
          }
          const feedbacks = item.generation_feedback as Array<{ rating: number | null }>
          feedbacks.forEach(fb => {
            if (fb.rating) {
              toolRatings[tool].sum += fb.rating
              toolRatings[tool].count += 1
            }
          })
        })
      }
    } catch (e) {
      console.error('Error fetching ratings:', e)
    }

    // Convert to array format for reportes page
    const toolReports = Object.entries(toolStats).map(([tool, stats]) => {
      const ratings = toolRatings[tool]
      const avgRating = ratings && ratings.count > 0
        ? ratings.sum / ratings.count
        : null

      return {
        tool: formatToolName(tool),
        uses: stats.uses || 0,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
        lastUsed: stats.lastUsed || new Date().toISOString(),
      }
    })

    return NextResponse.json({
      contentGenerated,
      reachEstimated: contentGenerated * 5000, // estimate 5K per piece
      timeSavedHours,
      roiProjected: Math.min(100, contentGenerated * 8), // 8% per generation, capped at 100%
      toolsUsed,
      quickActionsExecuted,
      toolReports,
    })
  } catch (error) {
    console.error('Error in client-portal stats:', error)
    return NextResponse.json(
      {
        contentGenerated: 0,
        reachEstimated: 0,
        timeSavedHours: 0,
        roiProjected: 0,
        toolsUsed: 0,
        quickActionsExecuted: 0,
      },
      { status: 200 }
    )
  }
}
