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

  const results: Record<string, any> = {}

  // Test brand_profiles
  try {
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('id,brand_name')
      .eq('client_id', clientId)
      .maybeSingle()
    results.brand_profiles = { data, error: error?.message }
  } catch (e: any) {
    results.brand_profiles = { error: e.message }
  }

  // Test content_pillars
  try {
    const { data, error } = await supabase
      .from('content_pillars')
      .select('id,name,client_id')
      .eq('client_id', clientId)
      .limit(1)
    results.content_pillars = { count: data?.length || 0, error: error?.message }
  } catch (e: any) {
    results.content_pillars = { error: e.message }
  }

  return NextResponse.json({
    user_email: user.email,
    user_client_id: clientId,
    results
  })
}
