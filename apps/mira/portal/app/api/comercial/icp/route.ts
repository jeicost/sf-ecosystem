import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { clientId, ...fields } = body

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const allowed = [
    'icp_name', 'industries', 'company_sizes', 'geographies',
    'job_titles', 'pain_points', 'trigger_events', 'disqualifiers',
    'min_budget_usd', 'decision_maker_signals',
  ]

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key]
  }

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from('icp_profiles')
    .select('id')
    .eq('client_id', clientId)
    .limit(1)
    .maybeSingle()

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('icp_profiles')
      .update(update)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabase
      .from('icp_profiles')
      .insert({ client_id: clientId, ...update })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json(result)
}
