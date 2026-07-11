import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getQuickActionPrompt } from '@/lib/generation/quick-action-prompts'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    const { action_type, input_data, department } = await req.json()

    if (!action_type || !input_data || !department) {
      return NextResponse.json(
        { error: 'Missing action_type, input_data, or department' },
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

    // Insert into quick_actions_results with 'processing' status
    const { data: actionData, error: actionError } = await admin
      .from('quick_actions_results')
      .insert({
        client_id: clientId,
        user_id: userId,
        department,
        action_type,
        input_data,
        output_data: {},
        status: 'processing',
      })
      .select('id')
      .single()

    if (actionError || !actionData) {
      console.error('Quick action insert error:', actionError)
      return NextResponse.json(
        { error: actionError?.message || 'Insert failed' },
        { status: 500 }
      )
    }

    const actionId = actionData.id

    // Get prompt for this quick action
    const prompt = await getQuickActionPrompt(action_type, {
      clientId,
      inputData: input_data,
    })

    if (!prompt) {
      await admin
        .from('quick_actions_results')
        .update({ status: 'failed', error_message: 'Unknown action type' })
        .eq('id', actionId)

      return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
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

    // Extract JSON from response
    let output_data = {}
    const textContent = message.content[0]
    if (textContent && 'text' in textContent) {
      const text = textContent.text
      // First try markdown code blocks (```json ... ```)
      const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (codeBlockMatch) {
        try {
          output_data = JSON.parse(codeBlockMatch[1].trim())
        } catch (e) {
          console.error('Failed to parse JSON from code block:', e)
        }
      }

      // If no code block or parsing failed, try direct JSON extraction
      if (!Object.keys(output_data).length) {
        // Try to find JSON object (non-greedy)
        const jsonMatch = text.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/)
        if (jsonMatch) {
          try {
            output_data = JSON.parse(jsonMatch[0])
          } catch (e) {
            console.error('Failed to parse JSON from direct extraction:', e)
            // Last resort: try cleaning up and parsing again
            try {
              const cleaned = jsonMatch[0].replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ')
              output_data = JSON.parse(cleaned)
            } catch (e2) {
              console.error('Final parsing attempt failed:', e2)
            }
          }
        }
      }
    }

    const processingTime = Date.now() - startTime

    // Update with completion
    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        status: 'success',
        output_data,
        processing_time_ms: processingTime,
      })
      .eq('id', actionId)
      // Note: completed_at column may not exist in some schema versions

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      action_id: actionId,
      output_data,
      processing_time_ms: processingTime,
    })
  } catch (error) {
    console.error('Quick action endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action_id = searchParams.get('action_id')

    if (!action_id) {
      return NextResponse.json({ error: 'Missing action_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('quick_actions_results')
      .select('*')
      .eq('id', action_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Quick action GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}
