import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getToolkitPrompt } from '@/lib/generation/toolkit-prompts'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    const { tool_slug, input_data } = await req.json()

    if (!tool_slug || !input_data) {
      return NextResponse.json({ error: 'Missing tool_slug or input_data' }, { status: 400 })
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

    const admin = adminClient()
    const { data: accessData, error: accessError } = await admin
      .from('mira_project_access')
      .select('client_id')
      .eq('user_id', user.id)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json({ error: 'No client access found' }, { status: 403 })
    }

    const clientId = accessData.client_id

    // Insert generation request into queue with 'processing' status
    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .insert({
        client_id: clientId,
        user_id: user.id,
        tool_slug,
        input_data,
        status: 'processing',
      })
      .select('id')
      .single()

    if (queueError || !queueData) {
      console.error('Queue insert error:', queueError)
      return NextResponse.json({ error: queueError?.message || 'Queue insert failed' }, { status: 500 })
    }

    const queueId = queueData.id

    // Generate prompt for this tool
    const prompt = await getToolkitPrompt(tool_slug, {
      clientId,
      inputData: input_data,
    })

    if (!prompt) {
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: 'Unknown tool' })
        .eq('id', queueId)

      return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }

    // Call Claude
    const message = await claude.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract JSON from Claude's response
    let result = {}
    const textContent = message.content[0]
    if (textContent && 'text' in textContent) {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      }
    }

    const generationTime = Date.now() - startTime

    // Update queue with result
    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        status: 'completed',
        result_data: result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      queue_id: queueId,
      result,
      generation_time_ms: generationTime,
    })
  } catch (error) {
    console.error('Generation endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check generation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const queue_id = searchParams.get('queue_id')

    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      queue_id,
      status: data.status,
      result_data: data.result_data,
      error_message: data.error_message,
      completed_at: data.completed_at,
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
