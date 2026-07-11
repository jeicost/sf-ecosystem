import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase'

// GET: List documents for client
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
      .from('client_documentation')
      .select('id, doc_type, title, description, file_size, uploaded_at, original_filename')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('uploaded_at', { ascending: false })

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
    const { doc_type, title, description, file_url, file_size, file_mime_type, original_filename } = body

    if (!title || !file_url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, file_url' },
        { status: 400 }
      )
    }

    const { data, error } = await admin
      .from('client_documentation')
      .insert({
        client_id: clientId,
        doc_type: doc_type || 'general',
        title,
        description: description || null,
        file_url,
        file_size: file_size || 0,
        file_mime_type: file_mime_type || 'application/octet-stream',
        original_filename: original_filename || title,
        uploaded_by: user.id,
        is_indexed: false,
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

// DELETE: Archive document
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 })
    }

    const admin = adminClient()
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
