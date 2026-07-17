import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = request.nextUrl.searchParams.get('project_id')

    if (!projectId) {
      return Response.json(
        { error: 'Missing project_id query parameter' },
        { status: 400 }
      )
    }

    const client = createAdminClient()
    const { data, error } = await client
      .from('pages')
      .select('id, title, slug, status, created_at, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return Response.json({ pages: data || [] }, { status: 200 })
  } catch (err) {
    console.error('Error fetching pages:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, title, slug } = body

    if (!project_id || !title || !slug) {
      return Response.json(
        { error: 'Missing required fields: project_id, title, slug' },
        { status: 400 }
      )
    }

    const client = createAdminClient()

    // Check if slug already exists in this project
    const { data: existing } = await client
      .from('pages')
      .select('id')
      .eq('project_id', project_id)
      .eq('slug', slug)
      .single()

    if (existing) {
      return Response.json(
        { error: 'Page slug already exists in this project' },
        { status: 409 }
      )
    }

    // Create page with empty sections
    const { data: page, error } = await client
      .from('pages')
      .insert({
        project_id,
        title,
        slug,
        status: 'draft',
        sections_json: [],
      })
      .select()
      .single()

    if (error) throw error

    return Response.json(
      {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Error creating page:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
