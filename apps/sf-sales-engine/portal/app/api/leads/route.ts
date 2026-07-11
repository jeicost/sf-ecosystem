import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SF_CLIENT_ID = '00000000-0000-0000-0000-000000000001'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const minScore = searchParams.get('min_score')
  const stage = searchParams.get('stage')

  const db = adminClient()
  let query = db
    .from('leads')
    .select('*')
    .eq('client_id', SF_CLIENT_ID)
    .order('hot_score', { ascending: false })

  if (minScore) query = query.gte('hot_score', parseInt(minScore))
  if (stage)    query = query.eq('stage', stage)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
