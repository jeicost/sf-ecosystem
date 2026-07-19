import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getDocumentPrompt, DOC_TYPES } from '@/lib/generation/document-prompts'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    try {
      return JSON.parse(fenced[1])
    } catch { /* fall through */ }
  }
  const braces = text.match(/\{[\s\S]*\}/)
  if (braces) {
    try {
      return JSON.parse(braces[0])
    } catch { /* fall through */ }
  }
  return {}
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { doc_type, client_id, input_data = {} } = await req.json()

    if (!doc_type || !DOC_TYPES.includes(doc_type)) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
    }

    const admin = adminClient()

    // Resolve client: explicit id or the user's client
    let clientId = client_id as string | undefined
    if (!clientId) {
      clientId = user.user_metadata?.client_id
    }
    if (!clientId) {
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      clientId = accessData?.project_id
    }
    if (!clientId) {
      return NextResponse.json({ error: 'No client context' }, { status: 403 })
    }

    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .insert({
        client_id: clientId,
        user_id: user.id,
        tool_slug: doc_type,
        input_data,
        status: 'processing',
      })
      .select('id')
      .single()

    if (queueError || !queueData) {
      return NextResponse.json(
        { error: queueError?.message || 'Queue insert failed' },
        { status: 500 }
      )
    }
    const queueId = queueData.id

    try {
      const prompt = await getDocumentPrompt(doc_type, { clientId, inputData: input_data })
      if (!prompt) throw new Error('Unknown doc type')

      const message = await claude.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt }],
      })

      if (message.stop_reason === 'max_tokens') throw new Error('Response truncated')

      const block = message.content[0]
      const text = block && 'text' in block ? block.text : ''
      const result = extractJson(text)
      if (Object.keys(result).length === 0) throw new Error('Empty result after JSON parse')

      // Attach brand color
      let brandColor = '#8B5CF6'
      const { data: clientRow } = await admin
        .from('clients')
        .select('primary_color')
        .eq('id', clientId)
        .single()
      if (clientRow?.primary_color) brandColor = clientRow.primary_color

      const { error: updateError } = await admin
        .from('generation_queue')
        .update({
          status: 'completed',
          result_data: { ...result, brandColor },
          completed_at: new Date().toISOString(),
        })
        .eq('id', queueId)
      if (updateError) throw new Error(updateError.message)

      return NextResponse.json({ success: true, queue_id: queueId })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Generation failed'
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: msg })
        .eq('id', queueId)
      return NextResponse.json({ error: msg, queue_id: queueId }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 }
    )
  }
}
