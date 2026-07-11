import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase'

// GET: Fetch brand profile for client
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

    const admin = adminClient()
    const { data: accessData, error: accessError } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json({ error: 'No client access found' }, { status: 403 })
    }

    const clientId = accessData.project_id

    const { data, error } = await admin
      .from('brand_profiles')
      .select('id, name, mission, tone_of_voice, values, description, created_at, updated_at')
      .eq('client_id', clientId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Brand brain fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT: Update brand profile
export async function PUT(req: NextRequest) {
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

    const admin = adminClient()
    const { data: accessData, error: accessError } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json({ error: 'No client access found' }, { status: 403 })
    }

    const clientId = accessData.project_id
    const body = await req.json()
    const { name, mission, tone_of_voice, values, description } = body

    // Check if profile exists
    const { data: existing } = await admin
      .from('brand_profiles')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { data, error } = await admin
        .from('brand_profiles')
        .update({
          name: name || null,
          mission: mission || null,
          tone_of_voice: tone_of_voice || null,
          values: values || null,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, success: true })
    } else {
      // Create new
      const { data, error } = await admin
        .from('brand_profiles')
        .insert({
          client_id: clientId,
          name: name || null,
          mission: mission || null,
          tone_of_voice: tone_of_voice || null,
          values: values || null,
          description: description || null,
        })
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, success: true })
    }
  } catch (error) {
    console.error('Brand brain update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
