import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params

    const client = createAdminClient()
    const { data: page, error } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (error) throw error

    if (!page) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    return Response.json({ page }, { status: 200 })
  } catch (err) {
    console.error('Error fetching page:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const body = await request.json()
    const { title, slug, status, sections_json } = body

    const client = createAdminClient()

    // Fetch current page first (for page_versions snapshot)
    const { data: currentPage, error: fetchErr } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (fetchErr) throw fetchErr

    if (!currentPage) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create version snapshot if sections changed
    if (sections_json && JSON.stringify(sections_json) !== JSON.stringify(currentPage.sections_json)) {
      await client
        .from('page_versions')
        .insert({
          page_id: pageId,
          sections_json: currentPage.sections_json,
          created_at: new Date().toISOString(),
        })
        .single()
    }

    // Update page
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (status !== undefined) updateData.status = status
    if (sections_json !== undefined) updateData.sections_json = sections_json
    updateData.updated_at = new Date().toISOString()

    const { data: page, error: updateErr } = await client
      .from('pages')
      .update(updateData)
      .eq('id', pageId)
      .select()
      .single()

    if (updateErr) throw updateErr

    return Response.json({ page }, { status: 200 })
  } catch (err) {
    console.error('Error updating page:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const client = createAdminClient()

    const { error } = await client
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) throw error

    return Response.json({ deleted: true }, { status: 200 })
  } catch (err) {
    console.error('Error deleting page:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
