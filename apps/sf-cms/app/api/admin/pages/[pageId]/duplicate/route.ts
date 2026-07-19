import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

/**
 * POST /api/admin/pages/[pageId]/duplicate
 * Copies a page (title + sections) into a new draft with a "-copy" slug.
 * If the "-copy" slug is taken, appends -copy-2, -copy-3, ... (up to 20).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId } = await params
    const client = createAdminClient()

    const { data: source, error: fetchErr } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (fetchErr || !source) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    // Find a free slug within the same project
    let newSlug = `${source.slug}-copy`
    for (let i = 2; i <= 20; i++) {
      const { data: taken } = await client
        .from('pages')
        .select('id')
        .eq('project_id', source.project_id)
        .eq('slug', newSlug)
        .maybeSingle()
      if (!taken) break
      newSlug = `${source.slug}-copy-${i}`
    }

    const { data: copy, error: insertErr } = await client
      .from('pages')
      .insert({
        project_id: source.project_id,
        slug: newSlug,
        title: `${source.title} (copy)`,
        seo_title: source.seo_title,
        seo_description: source.seo_description,
        og_image_url: source.og_image_url,
        sections_json: source.sections_json,
        status: 'draft',
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    return Response.json({ page: copy }, { status: 201 })
  } catch (err) {
    console.error('Error duplicating page:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
