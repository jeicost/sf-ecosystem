import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

/**
 * Media management endpoints
 * POST /api/admin/media — Upload file to Supabase Storage + record metadata
 * GET /api/admin/media?project_id=<id> — List media for project
 */

export async function POST(request: NextRequest) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string

    if (!file || !projectId) {
      return Response.json(
        { error: 'Missing file or project_id' },
        { status: 400 }
      )
    }

    const client = createAdminClient()

    // Verify project exists
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('id, slug')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const storagePath = `media/${project.slug}/${filename}`

    const buffer = await file.arrayBuffer()
    const { error: uploadError, data: uploadData } = await client.storage
      .from('cms-media')
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return Response.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Record metadata in database
    const { data: media, error: dbError } = await client
      .from('media')
      .insert({
        project_id: projectId,
        filename: file.name,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cms-media/${storagePath}`,
        mime_type: file.type,
        size_bytes: file.size,
        alt_text: '',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      // Attempt cleanup (non-blocking)
      await client.storage.from('cms-media').remove([storagePath]).catch(console.error)
      return Response.json(
        { error: 'Failed to record media metadata' },
        { status: 500 }
      )
    }

    return Response.json(media, { status: 201 })
  } catch (err) {
    console.error('Error uploading media:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return Response.json(
        { error: 'Missing project_id query parameter' },
        { status: 400 }
      )
    }

    const client = createAdminClient()

    const { data: media, error } = await client
      .from('media')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('DB error:', error)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    return Response.json({ media }, { status: 200 })
  } catch (err) {
    console.error('Error fetching media:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
