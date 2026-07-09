import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const dadybox_id = 'e664873b-034d-48cd-9a45-8631672ef375'
  const salsa_id = '714a028e-a16d-428c-b8a9-3338f56f0a9c'

  const schema: Record<string, any> = {}

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

  // Check Salsa too
  const { data: bp_salsa } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', salsa_id)
    .single()

  const { data: cp_salsa } = await supabase
    .from('content_pillars')
    .select('*')
    .eq('client_id', salsa_id)
    .limit(1)

  schema.salsa = {
    brand_profiles_exists: bp_salsa ? true : false,
    content_pillars_count: cp_salsa?.length || 0
  }

  return NextResponse.json(schema)
}
