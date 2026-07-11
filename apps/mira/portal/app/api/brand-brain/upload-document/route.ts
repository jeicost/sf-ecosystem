import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const brand_profile_id = formData.get('brand_profile_id') as string

    if (!file || !brand_profile_id) {
      return NextResponse.json({ error: 'Missing file or brand_profile_id' }, { status: 400 })
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
      clientId = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else {
      const admin = adminClient()
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('client_id')
        .eq('user_id', user.id)
        .single()

      if (!accessData) {
        return NextResponse.json({ error: 'No client access' }, { status: 403 })
      }
      clientId = accessData.client_id
    }

    const admin = adminClient()

    // Read file content for text extraction
    const buffer = await file.arrayBuffer()
    const text = Buffer.from(buffer).toString('utf-8')

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
