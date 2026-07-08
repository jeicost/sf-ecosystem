import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const clientId = user.user_metadata?.client_id as string

  // Test 1: Try with anon key
  const { data: anonResult, error: anonError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle()

  // Test 2: Try with service role
  let serviceResult = null
  let serviceError = null
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const result = await adminClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle()
    serviceResult = result.data
    serviceError = result.error
  }

  return NextResponse.json({
    user_email: user.email,
    user_client_id: clientId,
    anon_query: {
      data: anonResult,
      error: anonError?.message,
    },
    service_query: serviceResult !== null ? {
      data: serviceResult,
      error: serviceError?.message,
    } : 'service_role_key_not_configured',
  })
}
