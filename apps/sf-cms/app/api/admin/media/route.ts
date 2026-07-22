import { requireSession } from '@/lib/auth/require-session'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

/**
 * Media management endpoints
 * POST /api/admin/media — Upload file to Supabase Storage + record metadata
 * GET /api/admin/media?project_id=<id> — List media for project
 */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

// MIME → extension. The extension comes from the validated MIME, never from
// the client filename; SVG is deliberately excluded (scriptable, public bucket).
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

/** Magic-byte check so a renamed file can't lie about its declared MIME. */
function matchesMagicBytes(mime: string, bytes: Uint8Array): boolean {
  const ascii = (from: number, len: number) =>
    String.fromCharCode(...bytes.slice(from, from + len))
  switch (mime) {
    case 'image/jpeg': return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case 'image/png': return bytes[0] === 0x89 && ascii(1, 3) === 'PNG'
    case 'image/webp': return ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP'
    case 'image/avif': return ascii(4, 4) === 'ftyp'
    case 'image/gif': return ascii(0, 4) === 'GIF8'
    case 'application/pdf': return ascii(0, 4) === '%PDF'
    default: return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSession()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string
    const altText = (formData.get('alt_text') as string | null) ?? ''

    if (!file || !projectId) {
      return Response.json(
        { error: 'Missing file or project_id' },
        { status: 400 }
      )
    }

    if (!(await canAccessProject(user, projectId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        { error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` },
        { status: 413 }
      )
    }

    const allowedExt = ALLOWED_TYPES[file.type]
    if (!allowedExt) {
      return Response.json(
        { error: `Unsupported file type '${file.type}'. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` },
        { status: 415 }
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
    const buffer = await file.arrayBuffer()

    if (!matchesMagicBytes(file.type, new Uint8Array(buffer.slice(0, 16)))) {
      return Response.json(
        { error: `File content does not match declared type '${file.type}'` },
        { status: 415 }
      )
    }

    const timestamp = Date.now()
    const filename = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${allowedExt}`
    const storagePath = `media/${project.slug}/${filename}`

    const { error: uploadError, data: uploadData } = await client.storage
      .from('cms-media')
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
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
        alt_text: altText,
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
    const user = await requireSession()
    if (!user) {
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

    if (!(await canAccessProject(user, projectId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
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
