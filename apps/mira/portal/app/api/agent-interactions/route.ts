import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

// Feedback (👍/👎) on agent chat responses — logged so future turns with the
// same agent/client can see what didn't land (see app/api/agent/route.ts,
// which reads recent 'not_helpful' rows back into the system prompt).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      client_id,
      agent_name,
      user_query,
      agent_response,
      user_feedback,
      outcome, // 'helpful' | 'not_helpful'
      tags,
    } = body

    if (!client_id || !agent_name || !user_query || !outcome) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('agent_interactions')
      .insert({
        client_id,
        agent_name,
        user_query: String(user_query).slice(0, 2000),
        agent_response: agent_response ? String(agent_response).slice(0, 4000) : null,
        user_feedback: user_feedback ?? null,
        outcome,
        tags: tags || [],
      })
      .select('id')
      .single()

    if (error) {
      console.error('Interaction log error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: 'logged', interaction_id: data?.id })
  } catch (error: any) {
    console.error('Error logging interaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET: retrieve interactions + satisfaction metrics for a client (optionally
// scoped to one agent) — used by admin/analytics views.
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('client_id')
    const agentName = req.nextUrl.searchParams.get('agent_name')

    if (!clientId) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const admin = adminClient()
    let query = admin.from('agent_interactions').select('*').eq('client_id', clientId)
    if (agentName) query = query.eq('agent_name', agentName)

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = data?.length || 0
    const helpful = data?.filter((d) => d.outcome === 'helpful').length || 0
    const notHelpful = data?.filter((d) => d.outcome === 'not_helpful').length || 0
    const satisfaction = total > 0 ? ((helpful / total) * 100).toFixed(1) : 0

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
