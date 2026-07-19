import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve client from query param or user metadata; batch reports have user_id NULL,
    // so filtering must be by client_id (RLS already scopes access via mira_project_access)
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id') || user.user_metadata?.client_id

    if (!clientId) {
      return NextResponse.json({ error: 'Missing client context' }, { status: 400 })
    }

    // Query both generation_queue (shared pipeline) and toolkit_results (campaign/blueprint specific)
    const [generationData, toolkitData] = await Promise.all([
      supabase
        .from('generation_queue')
        .select('*')
        .eq('status', 'completed')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('toolkit_results')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (generationData.error) {
      return NextResponse.json({ error: generationData.error.message }, { status: 500 })
    }

    if (toolkitData.error) {
      return NextResponse.json({ error: toolkitData.error.message }, { status: 500 })
    }

    // Combine and sort by created_at descending
    const combined = [
      ...(generationData.data || []),
      ...(toolkitData.data || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ data: combined.slice(0, 10) })
  } catch (err) {
    console.error('Deliverables error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
