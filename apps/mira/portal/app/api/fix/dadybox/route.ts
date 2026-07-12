import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuthGate } from '@/lib/auth-gate'

export async function POST() {
  try {
    await requireAuthGate()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const CLIENT_ID = 'e664873b-034d-48cd-9a45-8631672ef375'

  // Check if exists
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('id', CLIENT_ID)
    .single()

  if (existing) {
    return NextResponse.json({ status: 'exists', data: existing })
  }

  // Create Dadybox client
  const { data: created, error } = await supabase
    .from('clients')
    .insert({
      id: CLIENT_ID,
      name: 'Dadybox',
      slug: 'dadybox',
      supabase_client_id: CLIENT_ID,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'created', data: created })
}
