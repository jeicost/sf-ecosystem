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

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Try to find client
  if (user?.user_metadata?.client_id) {
    const { data: client, error } = await supabase
      .from('clients')
      .select('id,name,slug')
      .eq('id', user.user_metadata.client_id)
      .single()

    return NextResponse.json({
      user_email: user.email,
      user_client_id: user.user_metadata.client_id,
      user_client_slug: user.user_metadata.client_slug,
      query_result: client,
      query_error: error?.message,
    })
  }

  return NextResponse.json({ error: 'No client_id in metadata' }, { status: 400 })
}
