import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'
import { uploadFileToStorage, initializeStorageBucket } from '@/lib/supabase-storage'
import { AGENT_METADATA } from '@/lib/agent-meta'
import { createMessageForClient } from '@/lib/anthropic-client'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const formData = await req.formData()
    const file = formData.get('file') as File

    // Validate clientId (from query string)
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId query parameter' },
        { status: 400 }
      )
    }

    if (!clientId.match(/^[a-f0-9-]{36}$/i)) {
      return NextResponse.json(
        { error: 'Invalid clientId format' },
        { status: 400 }
      )
    }

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate agent role exists
    if (!AGENT_METADATA[params.role]) {
      return NextResponse.json(
        { error: 'Unknown agent role' },
        { status: 400 }
      )
    }

    // Validate file MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted: PDF, DOCX, TXT. Got: ${file.type}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit. Got: ${Math.round(file.size / 1024 / 1024)}MB` },
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // clientId explícito: validar el grant antes de usarlo
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    // Initialize storage bucket (idempotent)
    const bucketReady = await initializeStorageBucket()
    if (!bucketReady) {
      return NextResponse.json(
        { error: 'Failed to initialize storage' },
        { status: 500 }
      )
    }

    // Upload file to Supabase Storage
    const uploadResult = await uploadFileToStorage(clientId, params.role, file)
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      )
    }

    // Extracción de texto: PDF con pdf-parse v2 (antes se hacía
    // Buffer.toString('utf-8') sobre el binario = contexto corrupto para el
    // agente); texto plano en utf-8 con guard de binarios.
    let text = ''
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      if (file.type === 'application/pdf') {
        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: buffer })
        const parsed = await parser.getText()
        await parser.destroy()
        text = parsed.text
      } else {
        text = buffer.toString('utf-8')
        if (text.includes('\x00')) {
          console.warn('Possible non-UTF8 file detected, skipping analysis')
          text = ''
        }
      }
    } catch (decodeError) {
      console.warn('Could not extract file text, analysis will be skipped:', decodeError)
    }

    // Detect document type from filename
    const filename = file.name.toLowerCase()
    let docType = 'other'
    if (filename.includes('strategy')) docType = 'strategy'
    else if (filename.includes('research')) docType = 'research'
    else if (filename.includes('brief')) docType = 'brief'
    else if (filename.includes('context')) docType = 'context'

    const admin = adminClient()

    // Store document metadata + storage URL in Supabase
    const { data: docData, error: docError } = await admin
      .from('agent_documents')
      .insert({
        client_id: clientId,
        agent_role: params.role,
        document_type: docType,
        title: file.name,
        description: '',
        file_size: file.size,
        file_mime_type: file.type,
        original_filename: file.name,
        file_url: uploadResult.url,
        extracted_text: text || null,
        analysis_status: text ? 'processing' : 'skipped',
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (docError) {
      console.error('Document DB error:', docError)
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // Analyze document with Claude in background (only if text extracted)
    if (text) {
      (async () => {
        try {
          const analysis = await createMessageForClient(clientId, 'agent/upload-document', {
            model: 'claude-opus-4-8',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `Analyze this document and provide:
1. Brief summary (2-3 sentences)
2. Key points (bullet list, max 5)
3. How it relates to the agent's role

Document:
${text.slice(0, 5000)}${text.length > 5000 ? '...' : ''}`,
              },
            ],
          })

          const analysisText = analysis.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text)
            .join('')

          // Extract key points (simple splitting by bullet or line)
          const keyPoints = analysisText
            .split('\n')
            .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .slice(0, 5)
            .map((line) => line.replace(/^[-•]\s*/, '').trim())

          await admin
            .from('agent_documents')
            .update({
              analysis_status: 'completed',
              analysis_summary: analysisText,
              key_points: keyPoints,
              analyzed_at: new Date().toISOString(),
            })
            .eq('id', docData.id)
        } catch (analyzeError) {
          console.error('Document analysis error:', analyzeError)
          await admin
            .from('agent_documents')
            .update({ analysis_status: 'failed' })
            .eq('id', docData.id)
        }
      })()
    }

    return NextResponse.json({
      success: true,
      data: docData,
      file_url: uploadResult.url,
      fileName: file.name,
    })
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
