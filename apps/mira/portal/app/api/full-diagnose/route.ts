import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const clientId = user.user_metadata?.client_id
  const diagnosis: Record<string, any> = {}

  // Test 1: Check brand_profiles table structure and data
  try {
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    diagnosis.brand_profiles = {
      columns: data ? Object.keys(data) : null,
      data: data,
      error: error?.message,
      found: data ? true : false
    }
  } catch (e: any) {
    diagnosis.brand_profiles = { error: e.message }
  }

  // Test 2: Check content_pillars
  try {
    const { data, error } = await supabase
      .from('content_pillars')
      .select('*')
      .eq('client_id', clientId)
      .limit(2)

    diagnosis.content_pillars = {
      columns: data && data.length > 0 ? Object.keys(data[0]) : null,
      count: data?.length || 0,
      sample: data ? data.slice(0, 1) : null,
      error: error?.message,
      found: data && data.length > 0
    }
  } catch (e: any) {
    diagnosis.content_pillars = { error: e.message }
  }

  return NextResponse.json({
    user_email: user.email,
    user_client_id: clientId,
    diagnosis
  })
}
