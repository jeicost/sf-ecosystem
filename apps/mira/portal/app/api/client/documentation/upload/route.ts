import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('client_id') as string
    const title = formData.get('title') as string
    const docType = formData.get('doc_type') as string
    const tagsStr = formData.get('tags') as string

    if (!file || !clientId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, and TXT allowed.' },
        { status: 400 }
      )
    }

    // For now, simulate storage. In production: upload to Vercel Blob or S3
    const fileUrl = `/api/documents/${clientId}/${Date.now()}-${file.name}`
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : []

    const db = createClient()
    const { data: userData } = await db.auth.getUser()

    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = userData.user

    // Insert into Supabase
    const { data, error } = await db
      .from('client_documentation')
      .insert({
        client_id: clientId,
        doc_type: docType,
        title,
        description: '',
        file_url: fileUrl,
        file_size: file.size,
        file_mime_type: file.type,
        original_filename: file.name,
        extracted_text: '',
        tags,
        uploaded_by: user.id,
        is_indexed: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
