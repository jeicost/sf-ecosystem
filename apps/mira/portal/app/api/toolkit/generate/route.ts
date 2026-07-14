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

    // Dev mode bypass for local testing
    let clientId: string
    if (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' && (!user || authError)) {
      // Use hardcoded test client for dev mode
      clientId = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else {
      const admin = adminClient()
      const { data: accessData, error: accessError } = await admin
        .from('mira_project_access')
        .select('client_id')
        .eq('user_id', user.id)
        .single()

      if (accessError || !accessData) {
        return NextResponse.json({ error: 'No client access found' }, { status: 403 })
      }
      clientId = accessData.client_id
    }

    const admin = adminClient()
    const userId = user?.id || 'aa857626-5b89-4df5-8b0d-ed02803e9722'

    // Insert generation request into queue with 'processing' status
    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .insert({
        client_id: clientId,
        user_id: userId,
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
      model: 'claude-opus-4-1',
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
      const text = textContent.text

      // Try to extract JSON from markdown code blocks first
      let jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[1])
        } catch (e) {
          console.error('Failed to parse JSON from markdown block:', e)
        }
      } else {
        // Fall back to finding JSON object directly
        jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0])
          } catch (e) {
            console.error('Failed to parse JSON from text:', e)
          }
        }
      }
    }

    const generationTime = Date.now() - startTime

    // Debug: log what we're saving
    console.log(`[${tool_slug}] Saving result for queue ${queueId}:`, {
      hasResult: !!result,
      resultKeys: Object.keys(result),
      resultSize: JSON.stringify(result).length,
      sampleData: JSON.stringify(result).slice(0, 200),
    })

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

    // Auto-log to project memory (fire and forget, non-blocking)
    const resultSummary = typeof result === 'object'
      ? JSON.stringify(result).slice(0, 200)
      : String(result).slice(0, 200)

    void admin
      .from('project_memory')
      .insert({
        client_id: clientId,
        title: `Toolkit: ${tool_slug}`,
        category: 'generation',
        summary: resultSummary,
        full_content: result,
        tags: [tool_slug, 'toolkit'],
        source_department: 'toolkit',
      })

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
