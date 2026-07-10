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

  // Get brand profile
  const { data: profile, error: profile_error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', dadybox_id)
    .single()

  // Get content pillars
  const { data: pillars, error: pillars_error } = await supabase
    .from('content_pillars')
    .select('*')
    .eq('client_id', dadybox_id)

  return NextResponse.json({
    client_id: dadybox_id,
    profile: {
      exists: !!profile,
      data: profile,
      error: profile_error?.message
    },
    pillars: {
      count: pillars?.length || 0,
      data: pillars,
      error: pillars_error?.message
    }
  })
}
