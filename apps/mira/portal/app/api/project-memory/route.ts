import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient, userCanAccessClient } from '@/lib/resolve-client'

// GET: Fetch project memory for client
export async function GET(req: NextRequest) {
  try {
    // Multi-empresa: honra ?clientId= validando el grant; sin él, primer grant.
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const clientId = access.clientId
    const admin = adminClient()
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
    const body = await req.json()
    const { actionId, title, category, summary, tags, sourceDepartment, fullContent, projectId } = body

    // Multi-empresa: clientId del body validado por grant; sin él, primer grant.
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const clientId = access.clientId
    const admin = adminClient()

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
        created_by: access.userId,
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
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { memoryId, isPinned, isArchived } = body

    if (!memoryId) {
      return NextResponse.json({ error: 'Missing memoryId' }, { status: 400 })
    }

    const admin = adminClient()

    // Ownership: cargar la fila y verificar el grant sobre su client_id antes de actualizar
    const { data: memoryRow, error: memoryError } = await admin
      .from('project_memory')
      .select('id, client_id')
      .eq('id', memoryId)
      .maybeSingle()

    if (memoryError || !memoryRow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, memoryRow.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

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
