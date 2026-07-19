import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { estimateCostUsd } from '@/lib/anthropic-client'

// Consumo de IA del mes para un cliente (visible para el propio cliente y super_admin)
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clientId = new URL(req.url).searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const admin = adminClient()
    const { data: rows } = await admin
      .from('usage_log')
      .select('model, input_tokens, output_tokens, used_client_key')
      .eq('client_id', clientId)
      .gte('created_at', monthStart.toISOString())

    const usage = rows || []
    const inputTokens = usage.reduce((s, u) => s + u.input_tokens, 0)
    const outputTokens = usage.reduce((s, u) => s + u.output_tokens, 0)
    const costUsd = usage.reduce(
      (s, u) => s + estimateCostUsd(u.model, u.input_tokens, u.output_tokens),
      0
    )

    return NextResponse.json({
      month: monthStart.toISOString().slice(0, 7),
      generations: usage.length,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: Math.round(costUsd * 100) / 100,
      using_own_key: usage.some((u) => u.used_client_key),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Usage summary failed' },
      { status: 500 }
    )
  }
}
