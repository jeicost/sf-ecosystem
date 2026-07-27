import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient, userCanAccessClient } from '@/lib/resolve-client'

// GET: List documents for client
// Multi-empresa: honra ?clientId= validando grant; sin él, primer grant.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // Columnas reales aliaseadas a los nombres que el front ya consume
    // (el select anterior pedía columnas de la 0015 nunca aplicada — el
    // listado de la biblioteca fallaba con error de columna).
    const admin = adminClient()
    const { data, error } = await admin
      .from('client_documentation')
      .select('id, doc_type, title, description, file_size:file_size_bytes, uploaded_at:created_at, original_filename:filename, storage_url')
      .eq('client_id', access.clientId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Upload document (metadata only, file URL passed)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { doc_type, title, description, file_url, file_size, file_mime_type, original_filename } = body

    if (!title || !file_url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, file_url' },
        { status: 400 }
      )
    }

    // Columnas del esquema REAL (verificado 2026-07-27): storage_url/filename/
    // file_size_bytes; doc_type con CHECK ('brand-book','handbook','product-doc',
    // 'marketing','other'). El insert anterior usaba los nombres de la migración
    // 0015 nunca aplicada (file_url/file_size/original_filename/is_indexed) —
    // TODA subida a la biblioteca fallaba con error de columna.
    const VALID_DOC_TYPES = ['brand-book', 'handbook', 'product-doc', 'marketing', 'other']
    const admin = adminClient()
    const { data, error } = await admin
      .from('client_documentation')
      .insert({
        client_id: access.clientId,
        doc_type: VALID_DOC_TYPES.includes(doc_type) ? doc_type : 'other',
        title,
        description: description || null,
        storage_url: file_url,
        file_size_bytes: file_size || 0,
        file_mime_type: file_mime_type || 'application/octet-stream',
        filename: original_filename || title,
        uploaded_by: access.userId,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Archive document — ownership por el client_id de la fila
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: row } = await admin
      .from('client_documentation')
      .select('id, client_id')
      .eq('id', documentId)
      .maybeSingle()

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const { error } = await admin
      .from('client_documentation')
      .update({ is_archived: true })
      .eq('id', documentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
