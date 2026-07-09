import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { tool_slug, input_data } = await req.json()

    if (!tool_slug || !input_data) {
      return NextResponse.json({ error: 'Missing tool_slug or input_data' }, { status: 400 })
    }

    // Get authenticated user from cookies
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

    // Get user's current client_id (from mira_project_access)
    const admin = adminClient()
    const { data: accessData, error: accessError } = await admin
      .from('mira_project_access')
      .select('client_id')
      .eq('user_id', user.id)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json({ error: 'No client access found' }, { status: 403 })
    }

    // Insert generation request into queue
    const { data, error } = await admin
      .from('generation_queue')
      .insert({
        client_id: accessData.client_id,
        user_id: user.id,
        tool_slug,
        input_data,
        status: 'queued',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Queue insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Trigger n8n webhook here to start async generation
    // const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     queue_id: data.id,
    //     tool_slug,
    //     input_data,
    //   }),
    // })

    return NextResponse.json({
      success: true,
      queue_id: data.id,
      message: 'Generation queued successfully',
    })
  } catch (error) {
    console.error('Generation endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check generation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const queue_id = searchParams.get('queue_id')

    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      queue_id,
      status: data.status,
      result_data: data.result_data,
      error_message: data.error_message,
      completed_at: data.completed_at,
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
