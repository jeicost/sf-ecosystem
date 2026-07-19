import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getQuickActionPrompt } from '@/lib/generation/quick-action-prompts'
import { generateAndStoreImage } from '@/lib/generation/openai-image'
import { createMessageForClient } from '@/lib/anthropic-client'

const VISUAL_ACTIONS = ['crear_post_visual', 'crear_carrusel_visual', 'editar_imagen_visual']

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
      // NOTE: project_id in mira_project_access is the CLIENT id (FK to clients — legacy naming)
      const { data: accessData, error: accessError } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (accessError || !accessData) {
        return NextResponse.json({ error: 'No client access found' }, { status: 403 })
      }
      clientId = accessData.project_id
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
    const message = await createMessageForClient(clientId, 'quick-actions', {
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    if (message.stop_reason === 'max_tokens') {
      await admin
        .from('quick_actions_results')
        .update({ status: 'failed', error_message: 'Output truncated at max_tokens' })
        .eq('id', actionId)
      return NextResponse.json({ error: 'Output truncated — try a shorter input' }, { status: 500 })
    }

    // Extract text from Claude response
    const rawText = (message.content[0] as any)?.text || ''

    // Extract JSON from response - improved with better detection
    let output_data = {}
    const textContent = message.content[0]
    if (textContent && 'text' in textContent) {
      const text = textContent.text

      // Strategy 1: Look for markdown code blocks (```json ... ```)
      const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
      if (codeBlockMatch) {
        try {
          output_data = JSON.parse(codeBlockMatch[1].trim())
        } catch (e) {
          // Code block found but invalid JSON, try raw text below
        }
      }

      // Strategy 2: If no valid JSON from code block, find standalone JSON object
      if (!Object.keys(output_data).length) {
        // Find the first complete JSON object by matching braces
        let braceCount = 0
        let jsonStart = -1
        let jsonEnd = -1

        for (let i = 0; i < text.length; i++) {
          if (text[i] === '{') {
            if (braceCount === 0) jsonStart = i
            braceCount++
          } else if (text[i] === '}') {
            braceCount--
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i + 1
              break
            }
          }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
          const potentialJson = text.substring(jsonStart, jsonEnd)
          try {
            output_data = JSON.parse(potentialJson)
          } catch (e) {
            // Try one more time with whitespace cleanup
            try {
              const cleaned = potentialJson.replace(/\n\s+/g, ' ').replace(/:\s+/g, ': ')
              output_data = JSON.parse(cleaned)
            } catch (e2) {
              // JSON extraction failed silently
            }
          }
        }
      }
    }

    // Visual actions: generate the actual image from the spec via OpenAI
    if (VISUAL_ACTIONS.includes(action_type) && Object.keys(output_data).length > 0) {
      const spec = output_data as Record<string, any>
      const imagePrompt: string | undefined =
        spec.image_generation_prompt ||
        spec.refinement_prompt ||
        spec.slides?.[0]?.image_generation_prompt ||
        spec.visual_direction
      if (imagePrompt) {
        const imageUrl = await generateAndStoreImage(imagePrompt, clientId, actionId)
        if (imageUrl) {
          output_data = { ...spec, image_url: imageUrl }
        }
      }
    }

    if (Object.keys(output_data).length === 0) {
      await admin
        .from('quick_actions_results')
        .update({ status: 'failed', error_message: 'Empty result after JSON parse' })
        .eq('id', actionId)
      return NextResponse.json({ error: 'Empty result after JSON parse' }, { status: 500 })
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

    // Auto-log to project memory (fire and forget, non-blocking)
    const outputSummary = typeof output_data === 'object'
      ? JSON.stringify(output_data).slice(0, 200)
      : String(output_data).slice(0, 200)

    void admin
      .from('project_memory')
      .insert({
        client_id: clientId,
        title: `Quick Action: ${action_type}`,
        category: 'action',
        summary: outputSummary,
        full_content: output_data,
        tags: [action_type, department],
        source_department: department,
      })

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
