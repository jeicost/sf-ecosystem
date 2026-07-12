import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string

    if (!file || !clientId) {
      return NextResponse.json(
        { error: 'Missing file or clientId' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // Validate file type
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read file content
    let text = ''
    try {
      const buffer = await file.arrayBuffer()
      text = Buffer.from(buffer).toString('utf-8')
      if (text.includes('\x00')) {
        console.warn('Possible non-UTF8 file detected')
      }
    } catch (decodeError) {
      console.error('Failed to decode file:', decodeError)
      return NextResponse.json(
        { error: 'Failed to read file. Ensure it is a valid text file.' },
        { status: 400 }
      )
    }

    // Detect document type from filename
    const filename = file.name.toLowerCase()
    let docType = 'other'
    if (filename.includes('strategy')) docType = 'strategy'
    else if (filename.includes('research')) docType = 'research'
    else if (filename.includes('brief')) docType = 'brief'
    else if (filename.includes('context')) docType = 'context'

    const admin = adminClient()

    // Store document in Supabase
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
        extracted_text: text,
        analysis_status: 'processing',
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // Analyze document with Claude in background
    (async () => {
      try {
        const analysis = await claude.messages.create({
          model: 'claude-opus-4-1',
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

    return NextResponse.json({ data: docData }, { status: 201 })
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
