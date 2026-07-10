import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Log agent interactions for behavior tracking & feedback loop
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      client_id,
      agent_name,
      user_query,
      agent_response,
      user_feedback,
      outcome, // 'helpful', 'not_helpful', 'neutral'
      tags,
    } = body

    if (!client_id || !agent_name || !user_query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = createClient()

    // Insert interaction log
    const { data, error } = await db
      .from('agent_interactions')
      .insert({
        client_id,
        agent_name,
        user_query,
        agent_response,
        user_feedback,
        outcome,
        tags: tags || [],
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Interaction log error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // If outcome is negative, this triggers Brand Brain refinement
    if (outcome === 'not_helpful') {
      console.log(`⚠️ Agent ${agent_name} needs Brand Brain review for: ${user_query}`)
      // Future: Auto-notify or trigger fine-tuning
    }

    return NextResponse.json({
      status: 'logged',
      interaction_id: data?.[0]?.id,
    })
  } catch (error: any) {
    console.error('Error logging interaction:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET: Retrieve interactions for analysis
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('client_id')
    const agentName = req.nextUrl.searchParams.get('agent_name')

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id required' },
        { status: 400 }
      )
    }

    const db = createClient()

    let query = db
      .from('agent_interactions')
      .select('*')
      .eq('client_id', clientId)

    if (agentName) {
      query = query.eq('agent_name', agentName)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Compute feedback metrics
    const total = data?.length || 0
    const helpful = data?.filter(d => d.outcome === 'helpful').length || 0
    const notHelpful = data?.filter(d => d.outcome === 'not_helpful').length || 0
    const satisfaction = total > 0 ? (helpful / total * 100).toFixed(1) : 0

    return NextResponse.json({
      interactions: data,
      metrics: {
        total,
        helpful,
        not_helpful: notHelpful,
        satisfaction_rate: `${satisfaction}%`,
      },
    })
  } catch (error: any) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
