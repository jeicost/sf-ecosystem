import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase'

// GET: Fetch project memory for client
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

    // Get query params
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const projectId = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = admin
      .from('project_memory')
      .select('id, title, category, summary, tags, source_department, created_at, is_pinned, project_id')
      .eq('client_id', clientId)
      .eq('is_archived', false)

    if (category) {
      query = query.eq('category', category)
    }
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Project memory fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Save action result to project memory
export async function POST(req: NextRequest) {
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
    const { actionId, title, category, summary, tags, sourceDepartment, fullContent, projectId } = body

    if (!actionId || !title || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: actionId, title, category' },
        { status: 400 }
      )
    }

    const { data, error } = await admin
      .from('project_memory')
      .insert({
        client_id: clientId,
        project_id: projectId || null,
        action_id: actionId,
        title,
        category,
        summary: summary || title,
        tags: tags || [],
        source_department: sourceDepartment || null,
        full_content: fullContent || null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Project memory save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH: Toggle pin/archive
export async function PATCH(req: NextRequest) {
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

    const body = await req.json()
    const { memoryId, isPinned, isArchived } = body

    if (!memoryId) {
      return NextResponse.json({ error: 'Missing memoryId' }, { status: 400 })
    }

    const admin = adminClient()
    const updates: Record<string, any> = {}
    if (isPinned !== undefined) updates.is_pinned = isPinned
    if (isArchived !== undefined) updates.is_archived = isArchived

    const { data, error } = await admin
      .from('project_memory')
      .update(updates)
      .eq('id', memoryId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Project memory update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
