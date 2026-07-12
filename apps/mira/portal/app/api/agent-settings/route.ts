import { createServiceClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const agentRole = searchParams.get('agentRole')

  if (!clientId || !agentRole) {
    return NextResponse.json(
      { error: 'Missing clientId or agentRole' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('agent_settings')
      .select('autonomy, tone_level')
      .eq('client_id', clientId)
      .eq('agent_role', agentRole)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (normal case for first load)
      throw error
    }

    return NextResponse.json({
      autonomy: data?.autonomy || 'always_ask',
      toneLevel: data?.tone_level || 0.5,
    })
  } catch (err) {
    console.error('Error fetching agent settings:', err)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { clientId, agentRole, autonomy, toneLevel } = await request.json()

  if (!clientId || !agentRole) {
    return NextResponse.json(
      { error: 'Missing clientId or agentRole' },
      { status: 400 }
    )
  }

  if (!['always_ask', 'full_auto'].includes(autonomy)) {
    return NextResponse.json(
      { error: 'Invalid autonomy value' },
      { status: 400 }
    )
  }

  if (toneLevel < 0 || toneLevel > 1) {
    return NextResponse.json(
      { error: 'toneLevel must be between 0 and 1' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServiceClient()

    // Upsert: try delete first (if exists), then insert
    await supabase
      .from('agent_settings')
      .delete()
      .eq('client_id', clientId)
      .eq('agent_role', agentRole)

    const { data, error } = await supabase
      .from('agent_settings')
      .insert({
        client_id: clientId,
        agent_role: agentRole,
        autonomy,
        tone_level: toneLevel,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      autonomy: data.autonomy,
      toneLevel: data.tone_level,
    })
  } catch (err) {
    console.error('Error updating agent settings:', err)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
