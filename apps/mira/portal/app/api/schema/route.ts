import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuthGate } from '@/lib/auth-gate'

export async function GET() {
  try {
    await requireAuthGate()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const dadybox_id = 'e664873b-034d-48cd-9a45-8631672ef375'
  const salsa_id = '714a028e-a16d-428c-b8a9-3338f56f0a9c'

  const schema: Record<string, any> = {}
  const correct_salsa_id = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'

  // Get brand_profiles structure and data
  const { data: bp_dadybox, error: bp_error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', dadybox_id)
    .single()

  schema.brand_profiles = {
    dadybox: {
      exists: bp_dadybox ? true : false,
      columns: bp_dadybox ? Object.keys(bp_dadybox) : null,
      data: bp_dadybox,
      error: bp_error?.message
    }
  }

  // Get content_pillars structure and count
  const { data: cp_dadybox, error: cp_error } = await supabase
    .from('content_pillars')
    .select('*')
    .eq('client_id', dadybox_id)

  schema.content_pillars = {
    dadybox: {
      count: cp_dadybox?.length || 0,
      columns: cp_dadybox && cp_dadybox.length > 0 ? Object.keys(cp_dadybox[0]) : null,
      sample: cp_dadybox ? cp_dadybox[0] : null,
      error: cp_error?.message
    }
  }

  // Check Salsa with CORRECT ID
  const { data: bp_salsa } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', correct_salsa_id)
    .single()

  const { data: cp_salsa } = await supabase
    .from('content_pillars')
    .select('*')
    .eq('client_id', correct_salsa_id)

  schema.salsa = {
    brand_profiles_exists: bp_salsa ? true : false,
    brand_profile_data: bp_salsa,
    content_pillars_count: cp_salsa?.length || 0,
    content_pillars_sample: cp_salsa?.[0] || null
  }

  return NextResponse.json(schema)
}
