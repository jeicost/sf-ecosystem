import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const brand_profile_id = formData.get('brand_profile_id') as string
    const explicitClientId = formData.get('clientId') as string | null

    if (!file || !brand_profile_id) {
      return NextResponse.json({ error: 'Missing file or brand_profile_id' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // Validate file type (only text and PDF)
    const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'application/pdf', 'text/csv']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: TXT, MD, PDF, CSV' },
        { status: 400 }
      )
    }

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

    let clientId: string
    if (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' && (!user || authError)) {
      clientId = explicitClientId || 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else if (explicitClientId) {
      // clientId explícito: validar el grant antes de usarlo
      if (!(await userCanAccessClient(user, explicitClientId))) {
        return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
      }
      clientId = explicitClientId
    } else {
      const admin = adminClient()
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessData?.length) {
        return NextResponse.json({ error: 'No client access' }, { status: 403 })
      }
      clientId = accessData[0].project_id
    }

    const admin = adminClient()

    // Read file content for text extraction
    let text = ''
    try {
      const buffer = await file.arrayBuffer()
      text = Buffer.from(buffer).toString('utf-8')

      // Validate UTF-8 decoding (check for null bytes which indicate corruption)
      if (text.includes('\x00')) {
        console.warn('Possible non-UTF8 file detected, text may be corrupted')
      }
    } catch (decodeError) {
      console.error('Failed to decode file as UTF-8:', decodeError)
      return NextResponse.json(
        { error: 'Failed to read file. Ensure it is a valid text file.' },
        { status: 400 }
      )
    }

    // Detect document type from filename
    const filename = file.name.toLowerCase()
    let docType = 'other'
    if (filename.includes('brand')) docType = 'brand_book'
    else if (filename.includes('handbook') || filename.includes('guide')) docType = 'handbook'
    else if (filename.includes('pitch')) docType = 'pitch_deck'
    else if (filename.includes('marketing')) docType = 'marketing_doc'
    else if (filename.includes('strategy')) docType = 'strategy_doc'

    // Store document in Supabase
    const { data: docData, error: docError } = await admin
      .from('brand_documents')
      .insert({
        client_id: clientId,
        brand_profile_id,
        document_type: docType,
        title: file.name,
        description: '',
        file_url: '',
        file_size: file.size,
        file_mime_type: file.type,
        original_filename: file.name,
        extracted_text: text,
        analysis_status: 'pending',
        uploaded_by: user?.id || null,
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    return NextResponse.json({ data: docData }, { status: 201 })
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
