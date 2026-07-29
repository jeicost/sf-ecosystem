import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getToolkitPrompt } from '@/lib/generation/toolkit-prompts'
import { createMessageForClient } from '@/lib/anthropic-client'
import { TOOLKIT_TOOLS as TOOLKIT_TOOL_DEFS } from '@/lib/toolkit-tools'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { getSessionUser } from '@/lib/resolve-client'
import { canUseFeature } from '@/lib/plans'

// Long-running generation: allow up to 800s on Vercel (fluid compute)
export const maxDuration = 800

// Batch-generatable tools: everything except tools with their own dedicated route
const TOOLKIT_TOOLS: string[] = TOOLKIT_TOOL_DEFS.filter((t) => !t.hasDedicatedRoute).map(
  (t) => t.slug
)

const MAX_ATTEMPTS = 3

/** extractJson wrapper that guarantees a plain object (batch results are objects). */
function extractJsonObject(text: string): Record<string, unknown> {
  const parsed = extractJson(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ExtractJsonError('Model output is not a JSON object', text)
  }
  return parsed as Record<string, unknown>
}

async function generateToolReport(
  admin: ReturnType<typeof adminClient>,
  clientId: string,
  userId: string | null,
  toolSlug: string,
  inputData: Record<string, unknown>
): Promise<string> {
  const { data: queueData, error: queueError } = await admin
    .from('generation_queue')
    .insert({
      client_id: clientId,
      user_id: userId,
      tool_slug: toolSlug,
      input_data: inputData,
      status: 'processing',
    })
    .select('id')
    .single()

  if (queueError || !queueData) {
    console.error(`[${toolSlug}] Queue insert error:`, queueError)
    throw new Error(`Queue insert failed: ${queueError?.message ?? 'unknown'}`)
  }

  const queueId = queueData.id

  try {
    const prompt = await getToolkitPrompt(toolSlug, { clientId, inputData })
    if (!prompt) throw new Error('Unknown tool')

    let result: Record<string, unknown> = {}
    let lastError = ''

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const message = await createMessageForClient(clientId, 'toolkit/generate-batch', {
          model: 'claude-opus-4-8',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })

        if (message.stop_reason === 'max_tokens') {
          throw new Error('Response truncated at max_tokens')
        }

        // Concatenate all text blocks (models may emit non-text blocks first)
        const text = message.content
          .map((b) => ('text' in b ? b.text : ''))
          .filter(Boolean)
          .join('\n')
        // Throws ExtractJsonError (with text preview) when no JSON can be extracted
        result = extractJsonObject(text)

        if (Object.keys(result).length === 0) {
          throw new Error(
            `Empty JSON object. stop=${message.stop_reason} blocks=[${message.content.map((b) => b.type).join(',')}]`
          )
        }
        break
      } catch (err) {
        lastError =
          err instanceof ExtractJsonError
            ? `JSON extraction failed: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Unknown error'
        result = {}
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 5000))
        }
      }
    }

    if (Object.keys(result).length === 0) {
      throw new Error(lastError || 'Generation produced empty result')
    }

    // Fetch brand color
    let brandColor = '#8B5CF6'
    try {
      const { data: brandProfile } = await admin
        .from('brand_profiles')
        .select('brand_data')
        .eq('client_id', clientId)
        .single()

      if (brandProfile?.brand_data?.visual_identity?.colors?.primary) {
        brandColor = brandProfile.brand_data.visual_identity.colors.primary
      }
    } catch {
      console.warn(`[${toolSlug}] Could not fetch brand color`)
    }

    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        status: 'completed',
        result_data: { ...result, brandColor },
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    if (updateError) throw new Error(`Update failed: ${updateError.message}`)

    console.log(`[${toolSlug}] ✅ Generated: ${queueId}`)
    return queueId
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await admin
      .from('generation_queue')
      .update({ status: 'failed', error_message: message })
      .eq('id', queueId)
    console.error(`[${toolSlug}] Generation failed:`, message)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.BATCH_SECRET
    if (!secret || req.headers.get('x-batch-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Entitlement por plan (P5): la ruta es server-to-server (x-batch-secret,
    // sin sesión normalmente), pero si la invoca un usuario logueado su plan
    // debe incluir toolkitGenerate — el plan 'consulta' queda fuera.
    const sessionUser = await getSessionUser().catch(() => null)
    if (sessionUser && !canUseFeature(sessionUser.user_metadata?.plan, 'toolkitGenerate')) {
      return NextResponse.json(
        { error: 'Tu plan no incluye la generación de Business Reports' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { client_id, input_data = {} } = body

    if (!client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    }

    const toolsToRun: string[] =
      Array.isArray(body.tools) && body.tools.length > 0
        ? body.tools.filter((t: string) => TOOLKIT_TOOLS.includes(t))
        : TOOLKIT_TOOLS

    const admin = adminClient()
    const userId = null // batch-generated, no specific user

    console.log(`🚀 Batch generation for ${client_id}: ${toolsToRun.length} tools`)

    const results: Record<string, string> = {}
    const errors: Record<string, string> = {}

    for (const toolSlug of toolsToRun) {
      try {
        results[toolSlug] = await generateToolReport(
          admin,
          client_id,
          userId,
          toolSlug,
          (input_data as Record<string, Record<string, unknown>>)[toolSlug] || {}
        )
        await new Promise((r) => setTimeout(r, 2000))
      } catch (error) {
        errors[toolSlug] = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    console.log(`✅ Batch complete for ${client_id}: ${Object.keys(results).length}/${toolsToRun.length}`)

    return NextResponse.json({
      success: true,
      client_id,
      generated: results,
      errors,
      total: toolsToRun.length,
      success_count: Object.keys(results).length,
    })
  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch generation failed' },
      { status: 500 }
    )
  }
}
